import React, { PureComponent, useState, useEffect, useRef, useCallback } from "react";
import {
    StyleSheet, Text, TextInput, TouchableOpacity, Pressable, View, ImageBackground,
    Image, Keyboard, Linking, Platform, KeyboardAvoidingView, ToastAndroid
} from "react-native";
import { ActivityIndicator, Modal, Portal } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import Toast from 'react-native-toast-message';
import { FlashList } from "@shopify/flash-list";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCamera, faLock, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import Clipboard from '@react-native-clipboard/clipboard';

import { sendMessage } from '~/store/actions/user';
import { decrypt } from "~/global/crypto";
import { PRIMARY, SECONDARY } from "~/global/variables";

const todaysDate = new Date().toLocaleDateString()

export default function Conversation(props) {

    const { peer_user } = props.route.params.data

    const dispatch = useDispatch()
    const conversation = useSelector(state => state.userReducer.conversations).get(peer_user.phone_no) ?? { messages: [] }
    const peer = useSelector(state => state.userReducer.contacts.find((contact) => contact.id === peer_user.id))
    const user_data = useSelector(state => state.userReducer.user_data)

    const [message, setMessage] = useState("")
    const [keyboardDidShowListener, setkeyboardDidShowListener] = useState(null)
    const [zoomMedia, setZoomMedia] = useState("")
    const scrollView = useRef()

    useEffect(() => {
        setkeyboardDidShowListener(Keyboard.addListener(
            'keyboardDidShow',
            () => scrollView.current?.scrollToOffset({ offset: 0, animated: true }),
        ))
        return () => keyboardDidShowListener?.remove()
    }, [])

    // Scroll to end when new messages appear (sent or recieved)
    useEffect(() => {
        scrollView.current?.scrollToOffset({ offset: 0, animated: true })
    }, [conversation.messages])

    const handleSend = useCallback(() => {
        if (message.trim() === "") return

        setMessage('')

        const toSend = {
            type: "MSG",
            message: message.trim()
        }
        dispatch(sendMessage(JSON.stringify(toSend), peer))
    }, [message])

    return (
        // <ImageBackground source={require('~/res/background2.jpg')} style={styles.container}>
        <View style={styles.container}>
            <FlashList
                removeClippedSubviews={false}
                contentContainerStyle={styles.messageList}
                ref={scrollView}
                inverted={conversation.messages?.length ? true : false} // silly workaround because ListEmptyComponent is rendered upside down when list empty
                data={conversation.messages}
                estimatedItemSize={95}
                renderItem={({ item }) => (
                    <Message
                        key={item.id}
                        item={item}
                        peer={peer}
                        isSent={item.sender === user_data.phone_no}
                        zoomMedia={(data) => setZoomMedia(data)} />
                )}
                ListEmptyComponent={() => <View><Text style={[styles.message, styles.system]}> No messages </Text></View>}
                ListHeaderComponent={() => (
                    <View style={styles.footer}>
                        <FontAwesomeIcon color="#77f777" icon={faLock} />
                        <Text style={{ color: 'white' }}> Click a message to decrypt it</Text>
                    </View>
                )}
            />

            <View style={styles.inputContainer}>
                <TouchableOpacity style={styles.button} onPress={() => props.navigation.navigate('CameraView', { data: { peer: peer } })}>
                    <FontAwesomeIcon icon={faCamera} size={20} style={styles.buttonIcon} />
                </TouchableOpacity>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <TextInput placeholder="Type a message"
                        multiline={true}
                        value={message}
                        onChangeText={setMessage}
                        style={styles.input}
                        clearButtonMode="always"
                    />
                </KeyboardAvoidingView>
                <TouchableOpacity style={styles.button} onPress={handleSend}>
                    <FontAwesomeIcon icon={faPaperPlane} size={20} style={styles.buttonIcon} />
                </TouchableOpacity>
            </View>

            <Portal>
                <Modal visible={zoomMedia} onDismiss={() => setZoomMedia("")}>
                    <Image source={{ uri: `data:image/jpeg;base64,${zoomMedia}` }}
                        resizeMode={'cover'}
                        style={{ width: "90%", height: "90%", alignSelf: 'center', alignContent: 'center' }}
                    />
                </Modal>
            </Portal>
        </View>
        // </ImageBackground >
    )
}

class Message extends PureComponent {
    constructor(props) {
        super(props)
        this.state = {
            loading: false,
            decryptedMessage: undefined
        }
    }

    copyMessage = () => {
        if (!this.state.decryptedMessage) return
        if (this.state.decryptedMessage?.type !== "MSG") return

        Clipboard.setString(this.state.decryptedMessage.message)
        ToastAndroid.show(
            'Message Copied',
            ToastAndroid.SHORT
        );
    }

    decryptMessage = async (item) => {
        const decryptedMessage = await decrypt(this.props.peer.session_key, item.message)
        try {
            return JSON.parse(decryptedMessage);
        } catch (err) {
            // Backwards compatibility for messages that didn't contain a type (pre v1.7)
            console.warn(err)
            return { type: "MSG", message: decryptedMessage }
        }
    }

    handleClick = async (item) => {
        try {
            this.setState({ loading: true })

            // Check if message is encrypted, if so, decrypt it
            if (!this.state.decryptedMessage) {
                const decryptedMessage = await this.decryptMessage(item)
                return this.setState({ decryptedMessage: decryptedMessage })
            }
            // Check if Image is contained in message, if so toggle size.
            if (this.state.decryptedMessage?.type === "IMG") {
                return this.props.zoomMedia(this.state.decryptedMessage.message)
            }
            // Check if message contains URL, if so, open browser.
            if (this.state.decryptedMessage?.type === "MSG") {
                const messageChunks = this.state.decryptedMessage?.message?.split(" ")
                const link = messageChunks.find(chunk => chunk.startsWith('https://') || chunk.startsWith('http://'))
                if (link) Linking.openURL(link)
            }
        } catch (err) {
            console.error("Error on message click:", err)
            Toast.show({
                type: 'error',
                text1: 'Failed to decrypt message',
                text2: err?.message || 'Session Key might have been rotated since this message was sent'
            });
        } finally {
            this.setState({ loading: false })
        }
    }

    renderMessage = (item, isSent) => {
        switch (item?.type) {
            // TODO: Add VIDEO, GIF and AUDIO message types
            case "IMG":
                return (
                    <Image source={{ uri: `data:image/jpeg;base64,${item.message}` }}
                        style={{ width: 160, height: 220 }}
                    />
                )
            case "MSG":
            default:
                const messageChunks = item.message.split(" ")
                const linkIndex = messageChunks.findIndex(chunk => chunk.startsWith('https://') || chunk.startsWith('http://'))

                if (linkIndex < 0) return <Text style={[isSent ? styles.sentText : styles.receivedText]} selectable>{item.message}</Text>

                return (
                    <Text style={[isSent ? styles.sentText : styles.receivedText]}>
                        <Text selectable>{messageChunks.slice(0, linkIndex).join(" ")}</Text>
                        <Text selectable style={{ color: 'blue' }}>{linkIndex > 0 ? " " : ""}{messageChunks[linkIndex]}{linkIndex < messageChunks.length - 1 ? " " : ""}</Text>
                        <Text selectable>{messageChunks.slice(linkIndex + 1, messageChunks.length).join(" ")}</Text>
                    </Text>
                )
        }
    }

    render = () => {
        const { item, isSent } = this.props
        const isEncrypted = !this.state.decryptedMessage
        const sent_at = new Date(item.sent_at)

        return (
            <Pressable selectable
                style={[styles.messageContainer, isSent ? styles.sent : styles.received]}
                onPress={() => this.handleClick(item)}
                onLongPress={() => this.copyMessage()}>
                <View selectable style={[styles.message]}>
                    {/* Loader */}
                    <ActivityIndicator style={{ position: 'absolute', zIndex: 10 }} animating={this.state.loading && !this.state.decryptedMessage} />
                    {/* Message preview */}
                    {isEncrypted &&
                        <>
                            <Text selectable style={[isSent ? styles.sentText : styles.receivedText]}>
                                {item.message?.length < 200 ? item.message : item.message?.substring(0, 197).padEnd(200, '...')}
                            </Text>
                            <FontAwesomeIcon style={{ position: 'absolute', zIndex: 10 }} color="#000" icon={faLock} size={25} />
                        </>
                    }
                    {/* Message */}
                    {!isEncrypted && this.renderMessage(this.state.decryptedMessage, isSent)}
                    {/* Footers of message */}
                    <View style={{ flexDirection: 'row', alignSelf: 'stretch', justifyContent: 'space-between' }}>
                        {isEncrypted && <Text style={[styles.messageTime, { alignSelf: 'flex-start' }]}> Message Encrypted </Text>}
                        <Text style={styles.messageTime}>
                            {sent_at.toLocaleDateString() === todaysDate
                                ? sent_at.toLocaleTimeString()
                                : sent_at.toLocaleDateString()
                            }
                        </Text>
                    </View>
                </View>
            </Pressable>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
        backgroundColor: SECONDARY
    }, messageList: {
        paddingHorizontal: 10
    }, messageContainer: {
        marginVertical: 5,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        maxWidth: '75%'
    }, message: {
        padding: 15,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center'
    }, received: {
        alignSelf: 'flex-start',
        backgroundColor: '#e6faea'
    }, receivedText: {
        color: SECONDARY
    }, sent: {
        alignSelf: 'flex-end',
        backgroundColor: PRIMARY
    }, sentText: {
        color: '#f2f0f0'
    }, system: {
        alignSelf: 'center',
        backgroundColor: 'gray'
    }, messageTime: {
        color: '#969393',
        alignContent: 'flex-end',
        fontSize: 13
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
        color: PRIMARY
    }, button: {
        padding: 10
    }
});