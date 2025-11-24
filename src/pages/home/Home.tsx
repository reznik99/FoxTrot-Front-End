import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, ScrollView, RefreshControl, Text, Alert } from 'react-native';
import { Divider, FAB, ActivityIndicator, Snackbar, Icon } from 'react-native-paper';
import RNNotificationCall from 'react-native-full-screen-notification-incoming-call';
import { StackScreenProps } from '@react-navigation/stack';
import InCallManager from 'react-native-incall-manager';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthStackParamList, HomeStackParamList, RootDrawerParamList } from '../../../App';
import { loadMessages, loadContacts, generateAndSyncKeys, loadKeys, registerPushNotifications, getTURNServerCreds } from '~/store/actions/user';
import { initializeWebsocket, destroyWebsocket } from '~/store/actions/websocket';
import ConversationPeek from '~/components/ConversationPeek';
import { setupInterceptors } from '~/store/actions/auth';
import { PRIMARY } from '~/global/variables';
import globalStyle from '~/global/style';
import { RootState, store } from '~/store/store';
import { Conversation, UserData } from '~/store/reducers/user';
import { deleteFromStorage, readFromStorage } from '~/global/storage';

type IProps = StackScreenProps<HomeStackParamList & AuthStackParamList & RootDrawerParamList, 'FoxTrot'>

export default function Home(props: IProps) {
    const insets = useSafeAreaInsets();
    const { conversations, loading, refreshing, socketErr } = useSelector((state: RootState) => state.userReducer);
    const [loadingMsg, setLoadingMsg] = useState('');
    const convos: Array<Conversation> = useMemo(() => {
        return [...conversations.values()]
            .map(convo => ({
                ...convo,
                _latest: convo.messages?.[0]?.sent_at
                    ? new Date(convo.messages[0].sent_at).getTime()
                    : 0,
            }))
            .sort((a, b) => b._latest - a._latest);
    }, [conversations]);

    useEffect(() => {
        const initLoad = async () => {
            // [background] Register device for push notifications
            store.dispatch(registerPushNotifications());
            // [background] Get TURN credentials for proxying calls if peer-to-peer ICE fails
            store.dispatch(getTURNServerCreds());
            // Start websocket connection to server
            await configureWebsocket();
            // Load keys from TPM
            const loaded = await loadKeypair();
            if (!loaded) {
                const generated = await generateKeypair();
                if (!generated) {
                    setLoadingMsg('');
                    return;
                }
            }
            // Load new messages from backend and old messages from storage
            await loadMessagesAndContacts();
            // Setup axios interceptors
            setupInterceptors(props.navigation);
            // Register Call Screen handler
            RNNotificationCall.addEventListener('answer', (info) => {
                console.debug('RNNotificationCall: User answered call', info);
                RNNotificationCall.backToApp();
                const caller = JSON.parse(info.payload || '{}') as UserData;
                props.navigation.navigate('Call', { data: { peer_user: caller } });
            });
            RNNotificationCall.addEventListener('endCall', (payload) => {
                console.debug('RNNotificationCall: User ended call', payload);
                InCallManager.stopRingtone();
            });
            // Check if user answered a call in the background
            setLoadingMsg('Checking call status');
            const callerRaw = await readFromStorage('call_answered_in_background');
            if (callerRaw) {
                const caller = JSON.parse(callerRaw) as UserData;
                await deleteFromStorage('call_answered_in_background');
                props.navigation.navigate('Call', { data: { peer_user: caller } });
            }
            setLoadingMsg('');
        };
        initLoad();
        // returned function will be called on component unmount
        return () => {
            store.dispatch(destroyWebsocket());
        };
    }, []);

    const loadMessagesAndContacts = useCallback(async () => {
        setLoadingMsg('Loading contacts & messages...');
        await Promise.all([
            store.dispatch(loadContacts({ atomic: false })),
            store.dispatch(loadMessages()),
        ]);
    }, [store.dispatch]);

    const loadKeypair = useCallback(async () => {
        setLoadingMsg('Loading keys from TPM...');
        const loadedKeys = await store.dispatch(loadKeys());
        return loadedKeys.payload as boolean;
    }, [store.dispatch]);

    const generateKeypair = useCallback(async () => {
        setLoadingMsg('Generating cryptographic keys...');
        const success = await store.dispatch(generateAndSyncKeys());
        if (!success.payload) {
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
        }
        return success.payload as boolean;
    }, [store.dispatch]);

    const configureWebsocket = useCallback(async () => {
        setLoadingMsg('Initializing websocket...');
        await store.dispatch(initializeWebsocket());
    }, [store.dispatch]);

    return (
        <View style={globalStyle.wrapper}>
            <Snackbar visible={!!socketErr} style={{ zIndex: 100 }}
                onDismiss={() => { }}
                action={{
                    label: 'Reconnect',
                    onPress: () => {
                        configureWebsocket()
                            .finally(() => setLoadingMsg(''));
                    },
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
                        <ScrollView refreshControl={
                            <RefreshControl refreshing={refreshing}
                                onRefresh={() => {
                                    loadMessagesAndContacts()
                                        .finally(() => setLoadingMsg(''));
                                }} />}>
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

                        <FAB color="#fff"
                            style={[globalStyle.fab, { backgroundColor: PRIMARY, marginBottom: globalStyle.fab.margin + insets.bottom }]}
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
