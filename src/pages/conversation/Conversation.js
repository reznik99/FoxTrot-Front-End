import React, { useState, useEffect, useRef } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ImageBackground, Keyboard } from "react-native";
import { ActivityIndicator } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import Toast from 'react-native-toast-message';

import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faPaperPlane, faEllipsisH } from "@fortawesome/free-solid-svg-icons";
import { sendMessage } from '../../store/actions/user';
import { decrypt } from "~/global/crypto";


export default function Conversation(props) {
    const state = useSelector(state => state.userReducer)
    const dispatch = useDispatch()
    const { peer_user } = props.route.params.data

    const scrollView = useRef()
    const [message, setMessage] = useState("")
    const [decryptedMessages, _] = useState(new Map())
    const [decryptingIndex, setDecryptingIndex] = useState(-1)
    const conversation = state.conversations.get(peer_user.phone_no)
    
    const [keyboardDidShowListener, setkeyboardDidShowListener] = useState(null)
    const [keyboardDidHideListener, setkeyboardDidHideListener] = useState(null)

    useEffect(() => {
        setkeyboardDidShowListener(Keyboard.addListener(
            'keyboardDidShow',
            () => scrollView.current?.scrollToEnd({ animated: true }),
        ))
        setkeyboardDidHideListener(Keyboard.addListener(
            'keyboardDidHide',
            () => scrollView.current?.scrollToEnd({ animated: true }),
        ))
        scrollView.current?.scrollToEnd({ animated: false })
        return () => {
            keyboardDidShowListener?.remove();
            keyboardDidHideListener?.remove();
        }
    }, [])

    useEffect(() => {
        scrollView.current?.scrollToEnd({ animated: false })
    }, [scrollView])

    const handleSend = () => {
        if (message.trim() === "") return

        decryptedMessages.set(conversation?.messages?.length || 0, message)
        dispatch(sendMessage(message, peer_user)).finally(() => scrollView.current?.scrollToEnd({ animated: false }))
        setMessage('')
    }

    const decryptMessage = async (index, message) => {
        if (message.trim() === "") return
        if (decryptedMessages.has(index)) return

        try {
            setDecryptingIndex(index)
            const peer = state.contacts.find((contact) => contact.id === peer_user.id)
            const decryptedMessage = await decrypt(peer.session_key, message)
            decryptedMessages.set(index, decryptedMessage)

        } catch (err) {
            console.error("Error decrypting message", err)
            Toast.show({
                type: 'error',
                text1: 'Failed to decrypt message',
                text2: 'Session Key might have been rotated since this message was sent',
                visibilityTime: 6000
            });
        } finally {
            setDecryptingIndex(-1)
        }
    }

    return (
        <ImageBackground source={require('../../res/background.jpg')} style={styles.container}>

            <ScrollView style={styles.messageContainer} ref={scrollView} >
                {
                    conversation?.messages?.map((packet, index) => {
                        const sent = packet.sender === state.user_data.phone_no
                        const loading = decryptingIndex == index
                        const sent_at = new Date(packet.sent_at)
                        return <TouchableOpacity key={index} style={[styles.message, sent ? styles.sent : styles.received, loading ? {backgroundColor: '#333333f0'} : null]} onPress={() => decryptMessage(index, packet.message)}>
                            <ActivityIndicator style={{position: 'absolute', zIndex: 10}} animating={loading}/>
                            <Text> { decryptedMessages.get(index) || packet.message } </Text>
                            <Text style={styles.messageTime}> 
                                { sent_at.toLocaleDateString() === new Date().toLocaleDateString()
                                    ? sent_at.toLocaleTimeString()
                                    : sent_at.toLocaleDateString()
                                } 
                            </Text>
                        </TouchableOpacity>
                    }) || <Text style={[styles.message, styles.system]} >No messages</Text>
                }
            </ScrollView>

            <View style={styles.inputContainer}>
                <TouchableOpacity style={styles.button}>
                    <FontAwesomeIcon icon={faEllipsisH} size={20} style={styles.buttonIcon} />
                </TouchableOpacity>
                <TextInput placeholder="Type a message"
                    value={message}
                    onChangeText={val => setMessage(val)}
                    underlineColorAndroid='transparent'
                    style={styles.input}
                />
                <TouchableOpacity style={styles.button} onPress={handleSend}>
                    <FontAwesomeIcon icon={faPaperPlane} size={20} style={styles.buttonIcon} />
                </TouchableOpacity>
            </View>

        </ImageBackground >
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
    }, messageContainer: {
        height: "90%",
        width: "90%",
        alignSelf: 'center'
    }, message: {
        padding: 15,
        marginVertical: 5,
        borderRadius: 10,
        justifyContent: 'center', 
        alignItems: 'center'
    }, received: {
        alignSelf: 'flex-start',
        backgroundColor: '#faf1e6'
    }, sent: {
        alignSelf: 'flex-end',
        backgroundColor: '#abed87'
    }, system: {
        alignSelf: 'center',
        backgroundColor: 'gray'
    }, inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 10
    }, input: {
        width: '75%',
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#faf1e6'
    }, buttonIcon: {
        color: '#fff'
    }, messageTime: {
        color: 'gray',
        alignSelf: 'flex-end',
        fontSize: 12
    }
});