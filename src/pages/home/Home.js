import React, { useState, useEffect } from 'react'
import { View, ScrollView, RefreshControl, ActivityIndicator, Text } from 'react-native'
import { Divider, FAB } from 'react-native-paper'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faEnvelope } from '@fortawesome/free-solid-svg-icons'
import { useSelector, useDispatch } from 'react-redux'

import ConversationPeek from '../../components/ConversationPeek'
import globalStyle from "../../global/globalStyle"
import { loadMessages, loadContacts, generateAndSyncKeys } from '../../store/actions/user';

export default function Home(props) {

    const state = useSelector(state => state.userReducer)
    const dispatch = useDispatch()

    const [loadingMsg, setLoadingMsg] = useState('')

    useEffect(async () => {
        if (state.loading) return

        // If keys not loaded, generate them (first time login)
        if (!state.keys) {
            setLoadingMsg("Generating cryptographic keys...")
            await dispatch(generateAndSyncKeys())
        }

        setLoadingMsg("Loading messages...")
        await dispatch(loadContacts())
        await dispatch(loadMessages())
        setLoadingMsg('')
    }, [])

    reload = async () => {
        setLoadingMsg("Loading messages...")
        await dispatch(loadContacts())
        await dispatch(loadMessages())
        setLoadingMsg('')
    }


    return (
        <View style={globalStyle.wrapper}>
            {
                state.loading == true
                    ? <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                        <Text>{loadingMsg}</Text>
                        <ActivityIndicator color="#00FFFF" size="large" />
                    </View>
                    : <>
                        <ScrollView refreshControl={<RefreshControl refreshing={state.loading} onRefresh={reload} />}>
                            {
                                state.conversations?.length > 0
                                    ? state.conversations.map((convo, index) =>
                                    (<View key={index} >
                                        <ConversationPeek data={convo} navigation={props.navigation} />
                                        <Divider />
                                    </View>)
                                    )
                                    : <Text>No Conversations.</Text>
                            }
                        </ScrollView>
                        <FAB
                            style={[globalStyle.fab, { backgroundColor: "red" }]} color="#fff"
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

