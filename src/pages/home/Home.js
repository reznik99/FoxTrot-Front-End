import React, { useState, useEffect, useCallback } from 'react'
import { View, ScrollView, RefreshControl, Text } from 'react-native'
import { Divider, FAB, ActivityIndicator, Snackbar } from 'react-native-paper'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faEnvelope } from '@fortawesome/free-solid-svg-icons'
import { useSelector, useDispatch } from 'react-redux'

import { ConversationPeek } from '../../components'
import globalStyle from "~/global/globalStyle"
import { loadMessages, loadContacts, generateAndSyncKeys, loadKeys } from '~/store/actions/user'
import { initializeWebsocket, destroyWebsocket } from '~/store/actions/websocket'

export default function Home(props) {

    const state = useSelector(state => state.userReducer)
    const dispatch = useDispatch()
    const [loadingMsg, setLoadingMsg] = useState('')

    useEffect(() => {
        const initLoad = async () => {
            if (state.loading) return

            const loadedKeys = await (dispatch(loadKeys()))

            // If keys not loaded, generate them (first time login)
            if (!loadedKeys) {
                setLoadingMsg("Generating cryptographic keys...")
                await dispatch(generateAndSyncKeys())
                setLoadingMsg('')
            }

            loadAllMessages()

            configureWebsocket()
        }

        initLoad()

        // returned function will be called on component unmount 
        return async () => {
            await dispatch(destroyWebsocket())
        }
    }, [])

    const loadAllMessages = useCallback(async () => {
        setLoadingMsg("Loading messages...")
        await dispatch(loadContacts())
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
                onDismiss={configureWebsocket}
                action={{
                    label: 'Reconnect',
                    onPress: configureWebsocket,
                }}> {`Connection to servers lost! Please try again later`}
            </Snackbar>
            {
                state.loading == true
                    ? <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                        <Text>{loadingMsg}</Text>
                        <ActivityIndicator size="large" />
                    </View>
                    : <>
                        <ScrollView refreshControl={<RefreshControl refreshing={state.refreshing} onRefresh={loadAllMessages} />}>
                            {
                                state.conversations?.length > 0
                                    ? state.conversations.map((convo, index) =>
                                    (<View key={index} >
                                        <ConversationPeek data={convo} navigation={props.navigation} />
                                        <Divider />
                                    </View>)
                                    )
                                    : <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                                        <Text>No Conversations.</Text>
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

