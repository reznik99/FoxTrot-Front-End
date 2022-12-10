import React, { useState, useEffect, useCallback } from 'react'
import { View, ScrollView, RefreshControl, Text } from 'react-native'
import { Divider, FAB, ActivityIndicator, Snackbar } from 'react-native-paper'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faEnvelope } from '@fortawesome/free-solid-svg-icons'
import { useSelector, useDispatch } from 'react-redux'

import { ConversationPeek } from '../../components'
import globalStyle from "~/global/globalStyle"
import { loadMessages, loadContacts, generateAndSyncKeys, loadKeys, registerPushNotifications } from '~/store/actions/user'
import { initializeWebsocket, destroyWebsocket } from '~/store/actions/websocket'


export default function Home(props) {

    const state = useSelector(state => state.userReducer)
    const dispatch = useDispatch()
    const [loadingMsg, setLoadingMsg] = useState('')

    const conversations = [...state.conversations.values()].sort((c1, c2) => {
        if (!c1.messages?.length) return -1
        if (!c2.messages?.length) return 1
        return c1.messages[c1.messages.length - 1].sent_at < c2.messages[c2.messages.length - 1].sent_at ? 1 : -1
    })

    useEffect(() => {
        const initLoad = async () => {
            setLoadingMsg("Loading keys...")
            const loadedKeys = await (dispatch(loadKeys()))

            // If keys not loaded, generate them (first time login)
            if (!loadedKeys) {
                setLoadingMsg("Generating cryptographic keys...")
                const success = await dispatch(generateAndSyncKeys())
                setLoadingMsg('')
                if(!success) return props.navigation.navigate('Login', { data: { loggedOut: true } })
            }
            // Register device for push notifications
            dispatch(registerPushNotifications())
            // Load messages & start websocket connection to server
            await configureWebsocket()
            await loadAllMessages()
        }

        initLoad()

        // returned function will be called on component unmount 
        return async () => {
            await dispatch(destroyWebsocket())
        }
    }, [])

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
            <Snackbar visible={state.socketErr} style={{ zIndex: 100 }}
                onDismiss={() =>{}}
                action={{
                    label: 'Reconnect',
                    onPress: configureWebsocket,
                }}> {`Connection to servers lost! Please try again later`}
            </Snackbar>
            {
                state.loading || loadingMsg
                    ? <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                        <Text style={[globalStyle.errorMsg, {color: 'white', marginBottom: 10}]}>{loadingMsg}</Text>
                        <ActivityIndicator size="large" />
                    </View>
                    : <>
                        <ScrollView refreshControl={<RefreshControl refreshing={state.refreshing} onRefresh={loadAllMessages} />}>
                            { conversations?.length
                                ? conversations.map((convo, index) =>
                                    (<View key={index} >
                                        <ConversationPeek data={convo} navigation={props.navigation} />
                                        <Divider />
                                    </View>)
                                )
                                : <View style={{ flex: 1, justifyContent: "center", alignItems: "center"}}>
                                    <Text style={[globalStyle.errorMsg, {color: '#fff'}]}>No Conversations.</Text>
                                </View>
                            }
                        </ScrollView>
                        
                        <FAB
                            style={globalStyle.fab} color='#fff'
                            onPress={() => props.navigation.navigate('NewConversation')}
                            icon={({ size, color }) => (
                                <FontAwesomeIcon size={size} icon={faEnvelope} style={{ color: color }} />
                            )}
                        />
                    </>
            }
        </View>
    )
}

