import React, { useState, useEffect, useCallback } from 'react'
import { View, ScrollView, RefreshControl, Text, Alert } from 'react-native'
import { useSelector, useDispatch } from 'react-redux'
import { Divider, FAB, ActivityIndicator, Snackbar } from 'react-native-paper'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faComment } from '@fortawesome/free-solid-svg-icons'
import RNNotificationCall from "react-native-full-screen-notification-incoming-call"

import { ConversationPeek } from '~/components'
import globalStyle from "~/global/globalStyle"
import { loadMessages, loadContacts, generateAndSyncKeys, loadKeys, registerPushNotifications } from '~/store/actions/user'
import { initializeWebsocket, destroyWebsocket } from '~/store/actions/websocket'
import { setupInterceptors } from '~/store/actions/auth'


export default function Home(props) {

    const dispatch = useDispatch()
    const { conversations, loading, refreshing, socketErr, caller } = useSelector(state => state.userReducer)
    const [loadingMsg, setLoadingMsg] = useState('')
    const [convos, setConvos] = useState([])

    useEffect(() => {
        const initLoad = async () => {

            // Register device for push notifications
            setLoadingMsg("Loading data from server...")
            dispatch(registerPushNotifications())
            // Load messages & start websocket connection to server
            await configureWebsocket()
            await loadAllMessages()

            RNNotificationCall.addEventListener("answer", (payload) => {
                console.debug('User Answered')
                RNNotificationCall.backToApp()
                props.navigation.navigate('Call', { data: { peer_user: caller } })
            })
            RNNotificationCall.addEventListener("endCall", (payload) => {
                console.debug('User Declined')
            })

            setLoadingMsg("Loading keys...")
            const loadedKeys = await (dispatch(loadKeys()))
            setLoadingMsg('')

            // If keys not loaded, generate them (first time login)
            if (!loadedKeys) {
                setLoadingMsg("Generating cryptographic keys...")
                const success = await dispatch(generateAndSyncKeys())
                setLoadingMsg('')
                if (!success) {
                    Alert.alert("Failed to generate keys", "This account might have already logged into another device. Keys must be imported in the settings page.",
                        [
                            {
                                text: "Logout", onPress: () => {
                                    props.navigation.navigate('Login', {
                                        data: {
                                            loggedOut: true,
                                            errorMsg: "This account has already logged in another device. Public key cannot be overridden for security reasons."
                                        }
                                    })
                                }
                            },
                            {
                                text: "OK", onPress: () => { }
                            }
                        ]
                    )
                    return
                }
            }

            // Setup axios interceptors
            setupInterceptors(props.navigation)
        }

        initLoad()

        // returned function will be called on component unmount 
        return async () => {
            await dispatch(destroyWebsocket())
        }
    }, [])

    useEffect(() => {
        setConvos([...conversations.values()].sort((c1, c2) => {
            if (!c1.messages?.length) return -1
            if (!c2.messages?.length) return 1
            return new Date(c1.messages[0]?.sent_at).getTime() < new Date(c2.messages[0]?.sent_at).getTime() ? 1 : -1
        }))
    }, [conversations])

    const loadAllMessages = useCallback(async () => {
        setLoadingMsg("Loading contacts...")
        await dispatch(loadContacts(false))
        setLoadingMsg("Loading messages...")
        await dispatch(loadMessages())
        setLoadingMsg('')
    }, [])

    const configureWebsocket = useCallback(async () => {
        setLoadingMsg("Initializing websocket...")
        await dispatch(initializeWebsocket())
        setLoadingMsg('')
    }, [])

    return (
        <View style={globalStyle.wrapper}>
            <Snackbar visible={socketErr} style={{ zIndex: 100 }}
                onDismiss={() => { }}
                action={{
                    label: 'Reconnect',
                    onPress: configureWebsocket,
                }}>
                Connection to servers lost! Please try again later
            </Snackbar>
            {
                loading || loadingMsg
                    ? <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
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
                                </View>)
                                )
                                : <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                                    <Text style={[globalStyle.errorMsg, { color: '#fff' }]}>No Conversations.</Text>
                                </View>
                            }
                        </ScrollView>

                        <FAB
                            style={globalStyle.fab} color='#fff'
                            onPress={() => props.navigation.navigate('NewConversation')}
                            icon={({ size, color }) => (
                                <FontAwesomeIcon size={size} icon={faComment} style={{ color: color }} />
                            )}
                        />
                    </>
            }
        </View>
    )
}

