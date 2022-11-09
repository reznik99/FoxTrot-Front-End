
import React, { useState, useEffect, useCallback, useRef } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ImageBackground, Keyboard } from "react-native";
import { useSelector, useDispatch } from 'react-redux'
var Buffer = require("@craftzdog/react-native-buffer").Buffer;

import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faPaperPlane, faEllipsisH } from "@fortawesome/free-solid-svg-icons"
import { sendMessage } from '../../store/actions/user'
import { decryptAESGCM } from "~/global/crypto";


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
        borderRadius: 10
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
    }
});

export default function Conversation(props) {

    const data = props.route.params.data;

    const state = useSelector(state => state.userReducer)
    const dispatch = useDispatch()

    const scrollView = useRef()
    const [message, setMessage] = useState("")
    const [decryptedMessages, setDecryptedMessages] = useState(new Map())
    const [keyboardDidShowListener, setkeyboardDidShowListener] = useState(null)
    const [keyboardDidHideListener, setkeyboardDidHideListener] = useState(null)


    useEffect(() => {
        setkeyboardDidShowListener(Keyboard.addListener(
            'keyboardDidShow',
            _keyboardDidShow,
        ))
        setkeyboardDidHideListener(Keyboard.addListener(
            'keyboardDidHide',
            _keyboardDidHide,
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

    const _keyboardDidShow = useCallback(() => {
        scrollView.current?.scrollToEnd({ animated: true })
    }, [scrollView])

    const _keyboardDidHide = useCallback(() => {
        scrollView.current?.scrollToEnd({ animated: true })
    }, [scrollView])

    const handleSend = useCallback(async () => {
        if (message.trim() === "") return

        // Send message
        dispatch(sendMessage(message, data.other_user))
        // UX
        setMessage('')
        scrollView.current?.scrollToEnd({ animated: true })
    }, [message, data, scrollView])

    const decryptMessage = useCallback(async (index, message) => {
        if (message.trim() === "") return

        
        const newDecryptedMessages = decryptedMessages
        try {
            const peer = state.contacts.find((contact) => contact.id === data.other_user.id)
            const decryptedMessage = await decryptAESGCM(peer.sessionKey, message)
            newDecryptedMessages.set(index, decryptedMessage)

        } catch (err) {
            console.error("Error decrypting message", err)
        }

        setDecryptedMessages(newDecryptedMessages)
        scrollView.current?.scrollToEnd({ animated: true })
    }, [decryptedMessages, scrollView])

    return (
        <ImageBackground source={require('../../res/background.jpg')} style={styles.container}>

            <ScrollView style={styles.messageContainer} ref={scrollView} >
                {
                    data && data.messages ? data.messages.map((packet, index) => {
                        return packet.sender === state.user_data.phone_no
                            ? <Text key={index} style={[styles.message, styles.sent]}>{packet.message}</Text>
                            : <TouchableOpacity key={index} style={styles.button} onPress={() => decryptMessage(index+"", packet.message)}>
                                <Text style={[styles.message, styles.received]}>{decryptedMessages.get(index + "") || packet.message}</Text>
                            </TouchableOpacity>
                    }) : <Text style={[styles.message, styles.system]} >No messages</Text>
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