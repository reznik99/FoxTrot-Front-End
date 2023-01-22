import React, { PureComponent, useState, useEffect, useRef, useCallback } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, Pressable, View, ImageBackground, Keyboard, Linking } from "react-native";
import { ActivityIndicator } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import Toast from 'react-native-toast-message';
import { FlashList } from "@shopify/flash-list";

import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowRight, faEllipsisH, faLock } from "@fortawesome/free-solid-svg-icons";
import { sendMessage } from '~/store/actions/user';
import { decrypt } from "~/global/crypto";

const todaysDate = new Date().toLocaleDateString()

export default function Conversation(props) {

    const { peer_user } = props.route.params.data

    const dispatch = useDispatch()
    const conversation = useSelector(state => state.userReducer.conversations).get(peer_user.phone_no) ?? { messages: [] }
    const peer = useSelector(state => state.userReducer.contacts.find((contact) => contact.id === peer_user.id))
    const user_data = useSelector(state => state.userReducer.user_data)

    const [message, setMessage] = useState("")
    const [keyboardDidShowListener, setkeyboardDidShowListener] = useState(null)
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
        <ImageBackground source={require('~/res/background2.jpg')} style={styles.container}>

            <FlashList contentContainerStyle={styles.messageList}
                ref={scrollView}
                inverted={conversation.messages?.length ? true : false} // silly workaround because ListEmptyComponent is rendered upside down when list empty
                data={conversation.messages}
                estimatedItemSize={95}
                renderItem={({ item }) => <Message key={item.id} item={item} peer={peer} isSent={item.sender === user_data.phone_no} />}
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
                    <FontAwesomeIcon icon={faEllipsisH} size={20} style={styles.buttonIcon} />
                </TouchableOpacity>
                <TextInput placeholder="Type a message"
                    multiline={true}
                    value={message}
                    onChangeText={setMessage}
                    style={styles.input}
                />
                <TouchableOpacity style={styles.button} onPress={handleSend}>
                    <FontAwesomeIcon icon={faArrowRight} size={20} style={styles.buttonIcon} />
                </TouchableOpacity>
            </View>

        </ImageBackground >
    )
}

class Message extends PureComponent {
    constructor(props) {
        super(props)
        this.state = {
            loading: false,
            decryptedMessage: undefined,
        }
    }

    handleClick = async (item) => {
        try {
            if (!this.state.decryptedMessage) {
                this.setState({ loading: true })
                const decryptedMessage = await decrypt(this.props.peer.session_key, item.message)
                try {
                    const message = JSON.parse(decryptedMessage);
                    this.setState({ decryptedMessage: message })
                } catch (err) {
                    // Backwards compatibility
                    this.setState({ decryptedMessage: { type: "MSG", message: decryptedMessage } })
                }
                return
            }

            // Check if URL or Image is contained in message
            if (this.state.decryptedMessage?.type === "MSG") {
                const messageChunks = this.state.decryptedMessage?.message.split(" ")
                const link = messageChunks.find(chunk => chunk.startsWith('https://') || chunk.startsWith('http://'))
                if (link) Linking.openURL(link)
            } else {
                // TODO: Full screen the image/video ?
            }
        } catch (err) {
            console.error("Error decrypting message", err)
            Toast.show({
                type: 'error',
                text1: 'Failed to decrypt message',
                text2: 'Session Key might have been rotated since this message was sent'
            });
            this.setState({ loading: false })
        }
    }

    renderMessageText = (decryptedMessage) => {
        const { type, message } = decryptedMessage

        if (type === "IMG") {
            return <Image source={{ uri: 'data:image/jpg;base64,' + message }} width={250} />
        } else {
            const messageChunks = message.split(" ")
            const linkIndex = messageChunks.findIndex(chunk => chunk.startsWith('https://') || chunk.startsWith('http://'))

            if (linkIndex < 0) return <Text selectable>{message}</Text>

            return (
                <Text>
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
            <Pressable
                style={[styles.messageContainer, isSent ? styles.sent : styles.received]}
                onPress={() => this.handleClick(item)}>
                <View style={[styles.message, isEncrypted && { backgroundColor: '#999999a0' }]}>
                    <ActivityIndicator style={{ position: 'absolute', zIndex: 10 }} animating={this.state.loading && !this.state.decryptedMessage} />
                    {isEncrypted
                        ? <Text selectable> {item.message?.length < 200 ? item.message : item.message?.substring(0, 197).padEnd(200, '...')} </Text>
                        : this.renderMessageText(this.state.decryptedMessage)
                    }
                    {isEncrypted && <FontAwesomeIcon style={{ position: 'absolute', zIndex: 10 }} color="#333" icon={faLock} size={20} />}
                    <Text style={styles.messageTime}>
                        {sent_at.toLocaleDateString() === todaysDate
                            ? sent_at.toLocaleTimeString()
                            : sent_at.toLocaleDateString()
                        }
                    </Text>
                </View>
            </Pressable>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
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