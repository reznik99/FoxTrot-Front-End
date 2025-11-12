import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, RefreshControl, Text, Alert } from 'react-native';
import { Divider, FAB, ActivityIndicator, Snackbar, Icon } from 'react-native-paper';
import RNNotificationCall from 'react-native-full-screen-notification-incoming-call';
import { StackScreenProps } from '@react-navigation/stack';
import inCallManager from 'react-native-incall-manager';
import { useSelector } from 'react-redux';

import { AuthStackParamList, HomeStackParamList, RootDrawerParamList } from '../../../App';
import { loadMessages, loadContacts, generateAndSyncKeys, loadKeys, registerPushNotifications } from '~/store/actions/user';
import { initializeWebsocket, destroyWebsocket } from '~/store/actions/websocket';
import ConversationPeek from '~/components/ConversationPeek';
import { setupInterceptors } from '~/store/actions/auth';
import { PRIMARY } from '~/global/variables';
import globalStyle from '~/global/style';
import { RootState, store } from '~/store/store';
import { Conversation, UserData } from '~/store/reducers/user';

type IProps = StackScreenProps<HomeStackParamList & AuthStackParamList & RootDrawerParamList, 'FoxTrot'>

export default function Home(props: IProps) {
    const { conversations, loading, refreshing, socketErr } = useSelector((state: RootState) => state.userReducer);
    const [loadingMsg, setLoadingMsg] = useState('');
    const [convos, setConvos] = useState<Array<Conversation>>([]);

    useEffect(() => {
        const initLoad = async () => {

            // Register device for push notifications
            setLoadingMsg('Connecting to server...');
            store.dispatch(registerPushNotifications());

            // Start websocket connection to server
            await configureWebsocket();

            // Register Call Screen handler
            RNNotificationCall.addEventListener('answer', (info) => {
                console.debug('RNNotificationCall: User answered call', info);
                RNNotificationCall.backToApp();
                const caller = JSON.parse(info.payload || '{}') as UserData;
                props.navigation.navigate('Call', { data: { peer_user: caller } });
            });
            RNNotificationCall.addEventListener('endCall', (payload) => {
                console.debug('RNNotificationCall: User ended call', payload);
                inCallManager.stopRingtone();
            });

            // Load keys from TPM
            setLoadingMsg('Loading keys from TPM...');
            const loadedKeys = await store.dispatch(loadKeys());

            // If keys not loaded, generate them (first time login)
            if (!loadedKeys.payload) {
                setLoadingMsg('Generating cryptographic keys...');
                const success = await store.dispatch(generateAndSyncKeys());
                setLoadingMsg('');
                if (!success) {
                    Alert.alert('Failed to generate keys', 'This account might have already logged into another device. Keys must be imported in the settings page.',
                        [
                            {
                                text: 'Logout',
                                onPress: () => { props.navigation.navigate('Login', { data: { loggedOut: true, errorMsg: '' } }); },
                            }, {
                                text: 'OK',
                                onPress: () => { },
                            },
                        ]
                    );
                    return;
                }
            }

            // Load new messages from backend and old messages from storage
            setLoadingMsg('Loading data from server...');
            await loadAllMessages();

            // Setup axios interceptors
            setupInterceptors(props.navigation);
        };

        initLoad();

        // returned function will be called on component unmount
        return () => {
            store.dispatch(destroyWebsocket());
        };
    }, []);

    useEffect(() => {
        setConvos([...conversations.values()].sort((c1, c2) => {
            if (!c1.messages?.length) { return -1; }
            if (!c2.messages?.length) { return 1; }
            return new Date(c1.messages[0]?.sent_at).getTime() < new Date(c2.messages[0]?.sent_at).getTime() ? 1 : -1;
        }));
    }, [conversations]);

    const loadAllMessages = useCallback(async () => {
        setLoadingMsg('Loading contacts & messages...');
        await Promise.all([
            store.dispatch(loadContacts({ atomic: false })),
            store.dispatch(loadMessages())
        ])
        setLoadingMsg('');
    }, [store.dispatch]);

    const configureWebsocket = useCallback(async () => {
        setLoadingMsg('Initializing websocket...');
        await store.dispatch(initializeWebsocket());
        setLoadingMsg('');
    }, [store.dispatch]);

    return (
        <View style={globalStyle.wrapper}>
            <Snackbar visible={!!socketErr} style={{ zIndex: 100 }}
                onDismiss={() => { }}
                action={{
                    label: 'Reconnect',
                    onPress: configureWebsocket,
                }}>
                Connection to servers lost! Please try again later
            </Snackbar>
            {
                loading || loadingMsg
                    ? <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={[globalStyle.errorMsg, { color: 'white', marginBottom: 10 }]}>{loadingMsg}</Text>
                        <ActivityIndicator size="large" />
                    </View>
                    : <>
                        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadAllMessages} />}>
                            {convos?.length
                                ? convos.map((convo, index) =>
                                (<View key={index} >
                                    <ConversationPeek data={convo} navigation={props.navigation} />
                                    <Divider />
                                </View>))
                                : <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                    <Text style={[globalStyle.errorMsg, { color: '#fff' }]}>No Conversations.</Text>
                                </View>
                            }
                        </ScrollView>

                        <FAB
                            style={[globalStyle.fab, { backgroundColor: PRIMARY }]} color="#fff"
                            onPress={() => props.navigation.navigate('NewConversation')}
                            icon={renderFABIcon}
                        />
                    </>
            }
        </View>
    );
}

const renderFABIcon = (props: { size: number, color: string }) => {
    return <Icon source="message" color={props.color} size={props.size} />;
};
