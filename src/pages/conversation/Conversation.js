import React, { useState, useEffect, useRef } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, Pressable, View, ImageBackground, Keyboard } from "react-native";
import { ActivityIndicator } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import Toast from 'react-native-toast-message';

import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowRight, faEllipsisH, faLock } from "@fortawesome/free-solid-svg-icons";
import { sendMessage } from '~/store/actions/user';
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

    useEffect(() => {
        setkeyboardDidShowListener(Keyboard.addListener(
            'keyboardDidShow',
            () => scrollView.current?.scrollToEnd({ animated: true }),
        ))
        return () => {
            keyboardDidShowListener?.remove()
        }
    }, [])

    useEffect(() => {
        scrollView.current?.scrollToEnd({ animated: true })
    }, [scrollView, conversation?.messages])

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

            <FlatList style={styles.messageList} 
                ref={scrollView}
                data={conversation?.messages || []}
                renderItem={({item, index}) => {
                    const sent = item.sender === state.user_data.phone_no
                    const loading = decryptingIndex == index
                    const sent_at = new Date(item.sent_at)
                    const isEncrypted = !decryptedMessages.has(index)
                    return (
                        <Pressable key={index} 
                        style={[styles.messageContainer, sent ? styles.sent : styles.received, loading && {backgroundColor: '#777777f0'}]} 
                        onPress={() => decryptMessage(index, item.message)}>
                            <View style={[styles.message, isEncrypted && { backgroundColor: '#999999a0' }]}>
                                <ActivityIndicator style={{position: 'absolute', zIndex: 10}} animating={loading}/>
                                <Text> { decryptedMessages.get(index) || item.message } </Text>
                                { isEncrypted && <FontAwesomeIcon style={{position: 'absolute', zIndex: 10}} icon={faLock} size={20} />}
                                <Text style={styles.messageTime}> 
                                    { sent_at.toLocaleDateString() === new Date().toLocaleDateString()
                                        ? sent_at.toLocaleTimeString()
                                        : sent_at.toLocaleDateString()
                                    } 
                                </Text>
                            </View>
                        </Pressable>
                    )
                }}
                ListEmptyComponent={() => <Text style={[styles.message, styles.system]} >No messages</Text>}
                ListFooterComponent={() => (
                    <View style={styles.footer}>
                        <FontAwesomeIcon color="#77f777" icon={faLock} />
                        <Text style={{color: 'white'}}> Click a message to decrypt it</Text>
                    </View>
                )} 
            />

            <View style={styles.inputContainer}>
                <TouchableOpacity style={styles.button}>
                    <FontAwesomeIcon icon={faEllipsisH} size={20} style={styles.buttonIcon} />
                </TouchableOpacity>
                <TextInput placeholder="Type a message"
                    multiline={true}
                    value={message}
                    onChangeText={val => setMessage(val)}
                    underlineColorAndroid='transparent'
                    style={styles.input}
                />
                <TouchableOpacity style={styles.button} onPress={handleSend}>
                    <FontAwesomeIcon icon={faArrowRight} size={20} style={styles.buttonIcon} />
                </TouchableOpacity>
            </View>

        </ImageBackground >
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
    }, messageList: {
        height: "90%",
        width: "100%",
        paddingHorizontal: 10
    }, messageContainer: {
        marginVertical: 5,
        borderRadius: 10,
        justifyContent: 'center', 
        alignItems: 'center'
    }, message: {
        padding: 15,
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
    }, footer: {
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 8,
        marginVertical: 5,
        backgroundColor: '#333333a0',
        borderRadius: 10
    }, inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10
    }, input: {
        flex: 1,
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#faf1e6'
    }, buttonIcon: {
        color: '#fff'
    }, button: {
        padding: 10
    }, messageTime: {
        color: 'gray',
        alignSelf: 'flex-end',
        fontSize: 12
    }
});