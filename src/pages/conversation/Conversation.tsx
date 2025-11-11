import React, { PureComponent, useState, useEffect, useRef, useCallback } from 'react';
import {
    StyleSheet, Text, TextInput, TouchableOpacity, Pressable, View, Keyboard,
    Linking, KeyboardAvoidingView, ToastAndroid, Image,
    EmitterSubscription,
} from 'react-native';
import { ActivityIndicator, Icon, Modal, Portal } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { launchImageLibrary } from 'react-native-image-picker';
import { FlashList } from '@shopify/flash-list';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';

import { sendMessage } from '~/store/actions/user';
import { decrypt } from '~/global/crypto';
import { PRIMARY, SECONDARY } from '~/global/variables';
import FullScreenImage from '~/components/FullScreenImage';
import { StackScreenProps } from '@react-navigation/stack';
import { HomeStackParamList } from '../../../App';
import { AppDispatch, RootState } from '~/store/store';
import { message, UserData } from '~/store/reducers/user';

const todaysDate = new Date().toLocaleDateString();

export default function Conversation(props: StackScreenProps<HomeStackParamList, 'Conversation'>) {

    const { peer_user } = props.route.params.data;

    const dispatch = useDispatch<AppDispatch>();
    const conversation = useSelector((state: RootState) => {
        return state.userReducer.conversations.get(peer_user.phone_no)
            ?? { messages: [], other_user: peer_user };
    });
    const user_data = useSelector((state: RootState) => state.userReducer.user_data);

    const [loading, setLoading] = useState(false);
    const [inputMessage, setInputMessage] = useState('');
    const [zoomMedia, setZoomMedia] = useState('');
    const scrollView = useRef<any>(null);
    const [keyboardDidShowListener, setkeyboardDidShowListener] = useState<EmitterSubscription | null>(null);

    useEffect(() => {
        setkeyboardDidShowListener(Keyboard.addListener(
            'keyboardDidShow',
            () => scrollView.current?.scrollToOffset({ offset: 0, animated: true }),
        ));
        return () => keyboardDidShowListener?.remove();
    }, []);

    // Scroll to end when new messages appear (sent or recieved)
    useEffect(() => {
        scrollView.current?.scrollToOffset({ offset: 0, animated: true });
    }, [conversation.messages]);

    const handleSend = useCallback(async () => {
        if (inputMessage.trim() === '') { return; }

        try {
            setLoading(true);
            setInputMessage('');

            const toSend = JSON.stringify({
                type: 'MSG',
                message: inputMessage.trim(),
            });
            await dispatch(sendMessage({ message: toSend, to_user: peer_user }));
        } catch (err) {
            console.error('Error sending message:', err);
        } finally {
            setLoading(false);
        }
    }, [inputMessage, peer_user, dispatch]);

    const handleImageSelect = useCallback(async () => {
        try {
            setLoading(true);
            const { didCancel, assets } = await launchImageLibrary({ mediaType: 'photo', quality: 0.3 });
            if (didCancel || !assets?.length) { return; }

            // Render Camera page pre-filled with selected image
            props.navigation.navigate('CameraView', { data: { peer: peer_user, picturePath: assets[0].uri! } });
        } catch (err) {
            console.error('Error sending gallery image:', err);
        } finally {
            setLoading(false);
        }
    }, [props.navigation, peer_user]);

    const handleCameraSelect = useCallback(async () => {
        // Render Camera page
        props.navigation.navigate('CameraView', { data: { peer: peer_user, picturePath: '' } });
    }, [props.navigation, peer_user]);

    const renderListEmpty = useCallback(() => (
        <View><Text style={[styles.message, styles.system]}> No messages </Text></View>
    ), []);

    const renderListFooter = useCallback(() => (
        <View style={styles.footer}>
            <Icon source="lock" color="#77f777" size={20} />
            <Text style={{ color: 'white' }}> Click a message to decrypt it</Text>
        </View>
    ), []);

    return (
        <View style={styles.container}>
            <FlashList
                removeClippedSubviews={false}
                contentContainerStyle={styles.messageList}
                ref={scrollView as any}
                inverted={conversation.messages?.length ? true : false} // silly workaround because ListEmptyComponent is rendered upside down when list empty
                data={conversation.messages}
                estimatedItemSize={95}
                renderItem={({ item }) => (
                    <Message
                        key={item.id}
                        item={item}
                        peer={peer_user}
                        isSent={item.sender === user_data.phone_no}
                        zoomMedia={(data) => setZoomMedia(data)} />
                )}
                ListEmptyComponent={renderListEmpty}
                ListHeaderComponent={renderListFooter}
            />

            <View style={styles.inputContainer}>
                <TouchableOpacity style={styles.button} onPress={handleCameraSelect}>
                    <Icon source="camera" color={styles.buttonIcon.color} size={20} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={handleImageSelect}>
                    <Icon source="image" color={styles.buttonIcon.color} size={20} />
                </TouchableOpacity>
                <KeyboardAvoidingView behavior={'padding'} style={{ flex: 1 }}>
                    <TextInput placeholder="Type a message"
                        multiline={true}
                        value={inputMessage}
                        onChangeText={setInputMessage}
                        style={styles.input}
                        clearButtonMode="always"
                    />
                </KeyboardAvoidingView>

                {loading
                    ? <ActivityIndicator style={{ marginHorizontal: 5 }} />
                    : <TouchableOpacity style={styles.button} onPress={handleSend}>
                        <Icon source="send-lock" color={styles.buttonIcon.color} size={20} />
                    </TouchableOpacity>
                }

            </View>

            <Portal>
                <Modal visible={!!zoomMedia}
                    onDismiss={() => setZoomMedia('')}
                    contentContainerStyle={{ width: '100%', height: '100%' }}>
                    {zoomMedia && <FullScreenImage media={zoomMedia} onDismiss={() => setZoomMedia('')} />}
                </Modal>
            </Portal>
        </View>
    );
}

type decryptedMessage = {
    type: string,
    message: string,
}
type MProps = {
    item: message,
    isSent: boolean,
    peer: UserData,
    zoomMedia: (data: string) => void,
}
type MState = {
    loading: boolean,
    decryptedMessage?: decryptedMessage
}
class Message extends PureComponent<MProps, MState> {
    constructor(props: MProps) {
        super(props);
        this.state = {
            loading: false,
            decryptedMessage: undefined,
        };
    }

    copyMessage = () => {
        if (!this.state.decryptedMessage) { return; }
        if (this.state.decryptedMessage?.type !== 'MSG') { return; }

        Clipboard.setString(this.state.decryptedMessage.message);
        ToastAndroid.show(
            'Message Copied',
            ToastAndroid.SHORT
        );
    };

    decryptMessage = async (item: message) => {
        const decryptedMessage = await decrypt(this.props.peer.session_key!, item.message);
        try {
            return JSON.parse(decryptedMessage);
        } catch (err) {
            // Backwards compatibility for messages that didn't contain a type (pre v1.7)
            console.warn(err);
            return { type: 'MSG', message: decryptedMessage };
        }
    };

    renderMessage = (item: decryptedMessage | undefined, isSent: boolean) => {
        if (!item || item?.message) { return; }

        switch (item.type) {
            // TODO: Add VIDEO, GIF and AUDIO message types
            case 'IMG':
                return (
                    <Image source={{ uri: `data:image/jpeg;base64,${item.message}` }}
                        style={{ width: 200, height: 'auto', aspectRatio: 1.5 }}
                        resizeMode="contain" />
                );
            case 'MSG':
                const messageChunks = item.message.split(' ');
                const linkIndex = messageChunks.findIndex(chunk => chunk.startsWith('https://') || chunk.startsWith('http://'));

                if (linkIndex < 0) { return <Text style={[isSent ? styles.sentText : styles.receivedText]} selectable>{item.message}</Text>; }

                return (
                    <Text style={[isSent ? styles.sentText : styles.receivedText]}>
                        <Text selectable>{messageChunks.slice(0, linkIndex).join(' ')}</Text>
                        <Text selectable style={{ color: 'blue' }}>{linkIndex > 0 ? ' ' : ''}{messageChunks[linkIndex]}{linkIndex < messageChunks.length - 1 ? ' ' : ''}</Text>
                        <Text selectable>{messageChunks.slice(linkIndex + 1, messageChunks.length).join(' ')}</Text>
                    </Text>
                );
            default:
                console.warn('Unrecognized message type:', item.type);
                return null;
        }
    };

    handleClick = async (item: message) => {
        try {
            this.setState({ loading: true });
            const msgObject = this.state.decryptedMessage;

            // Check if message is encrypted, if so, decrypt it
            if (!msgObject) {
                const decryptedMessage = await this.decryptMessage(item);
                return this.setState({ decryptedMessage: decryptedMessage });
            }

            switch (msgObject?.type) {
                case 'IMG':
                    // Image is contained in message, then zoom in
                    this.props.zoomMedia(this.state.decryptedMessage!.message);
                    break;
                case 'MSG':
                    // If message contains URL open it in browser
                    const messageChunks = this.state.decryptedMessage?.message?.split(' ') || [];
                    const link = messageChunks.find(chunk => chunk.startsWith('https://') || chunk.startsWith('http://'));
                    if (link) { Linking.openURL(link); }
                    break;
                default:
                    console.warn('Unrecognized message type:', msgObject?.type);
                    break;
            }
        } catch (err: any) {
            console.error('Error on message click:', err);
            Toast.show({
                type: 'error',
                text1: 'Failed to decrypt message',
                text2: err?.message || 'Session Key might have been rotated since this message was sent',
            });
        } finally {
            this.setState({ loading: false });
        }
    };

    render = () => {
        const { item, isSent } = this.props;
        const isEncrypted = !this.state.decryptedMessage;
        const sent_at = new Date(item.sent_at);

        return (
            <Pressable style={[styles.messageContainer, isSent ? styles.sent : styles.received]}
                onPress={() => this.handleClick(item)}
                onLongPress={() => this.copyMessage()}>
                <View style={[styles.message]}>
                    {/* Loader */}
                    <ActivityIndicator style={{ position: 'absolute', zIndex: 10 }} animating={this.state.loading && !this.state.decryptedMessage} />
                    {/* Message preview */}
                    {isEncrypted &&
                        <>
                            <Text selectable style={[isSent ? styles.sentText : styles.receivedText]}>
                                {item.message?.length < 200 ? item.message : item.message?.substring(0, 197).padEnd(200, '...')}
                            </Text>
                            <View style={{ position: 'absolute', zIndex: 10 }}>
                                <Icon source="lock" color="#000" size={25} />
                            </View>
                        </>
                    }
                    {/* Message */}
                    {this.renderMessage(this.state.decryptedMessage, isSent)}
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
        );
    };
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        backgroundColor: SECONDARY,
    }, messageList: {
        paddingHorizontal: 10,
    }, messageContainer: {
        marginVertical: 5,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        maxWidth: '75%',
    }, message: {
        padding: 15,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    }, received: {
        alignSelf: 'flex-start',
        backgroundColor: '#333333a0',
    }, receivedText: {
        color: '#f2f0f0',
        fontFamily: 'Roboto',
    }, sent: {
        alignSelf: 'flex-end',
        backgroundColor: PRIMARY,
    }, sentText: {
        color: '#f2f0f0',
        fontFamily: 'Roboto',
    }, system: {
        alignSelf: 'center',
        backgroundColor: 'gray',
    }, messageTime: {
        color: '#969393',
        alignContent: 'flex-end',
        fontSize: 13,
    }, footer: {
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 8,
        marginVertical: 5,
        backgroundColor: '#333333a0',
        borderRadius: 10,
    }, inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    }, input: {
        flex: 1,
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#faf1e6',
    }, buttonIcon: {
        color: PRIMARY,
    }, button: {
        padding: 10,
    },
});
