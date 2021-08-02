
import React, { useState, useEffect } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ImageBackground, Keyboard } from "react-native";

import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faPaperPlane, faEllipsisH } from "@fortawesome/free-solid-svg-icons";

import userData from './../../store/userData';

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

    const { navigation } = props;
    const data = navigation.state.params.data;

    const [message, setMessage] = useState("")
    const [textInput, settextInput] = useState(null)
    const [scrollView, setscrollView] = useState(null)
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
        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        }
    }, [])

    _keyboardDidShow = () => {
        scrollView.scrollToEnd({ animated: true })
    }

    _keyboardDidHide = () => {
        scrollView.scrollToEnd({ animated: true })
    }

    sendMessage = async (data) => {
        if (message.trim() === "") return
        // Send Message
        await userData.sendMessage(data.parties[0], message)
        // Clear input
        textInput.clear()
        setMessage('')
    }

    return (
        <ImageBackground source={require('../../res/background.jpg')} style={styles.container}>

            <ScrollView style={styles.messageContainer} ref={ref => setscrollView(ref)}
                onContentSizeChange={(contentWidth, contentHeight) => {
                    scrollView.scrollToEnd({ animated: true });
                }}>
                {
                    data && data.messages ? data.messages.map((packet, index) => {
                        return packet.sender === userData.self.phone_no
                            ? <Text key={index} style={[styles.message, styles.sent]}>{packet.message}</Text>
                            : <Text key={index} style={[styles.message, styles.received]}>{packet.message}</Text>
                    }) : <Text style={[styles.message, styles.system]} >No messages</Text>
                }
            </ScrollView>

            <View style={styles.inputContainer}>
                <TouchableOpacity style={styles.button}>
                    <FontAwesomeIcon icon={faEllipsisH} size={20} style={styles.buttonIcon} />
                </TouchableOpacity>
                <TextInput placeholder="Type a message"
                    ref={input => { settextInput(input) }}
                    onChangeText={val => setMessage(val)}
                    underlineColorAndroid='transparent'
                    style={styles.input}
                />
                <TouchableOpacity style={styles.button} onPress={() => sendMessage(data)}>
                    <FontAwesomeIcon icon={faPaperPlane} size={20} style={styles.buttonIcon} />
                </TouchableOpacity>
            </View>

        </ImageBackground >
    )

}