import React, { useState } from 'react'
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native'
import { Avatar, ActivityIndicator, Button } from 'react-native-paper'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faCircle } from '@fortawesome/free-solid-svg-icons'
import { useSelector, useDispatch } from 'react-redux'

import { humanTime } from '~/global/helper'
import globalStyle from "~/global/globalStyle"
import { addContact } from '~/store/actions/user'

export default function ConversationPeek(props) {

    const dispatch = useDispatch()
    const user_phone_no = useSelector(state => state.userReducer.user_data?.phone_no)
    const contacts = useSelector(state => state.userReducer.contacts)
    const [loading, setLoading] = useState(undefined)
    
    const { data, navigation } = props
    const lastMessage = data.messages[0] ?? {}
    
    const isNew = lastMessage.sender !== user_phone_no && !lastMessage.seen
    const boldIfUnseen = isNew ? styles.unseenMessage : null 
    const isMessageRequest = !contacts.some(con => con.phone_no === data.other_user.phone_no)
    
    const acceptMessageRequest = async () => {
        setLoading("accept")
        await dispatch(addContact(data.other_user))
        setLoading(undefined)
    }
    const showError = () => {
        Alert.alert("Unable to reject message request",
            "This functionality isn't yet implemented. Simply ignore the message request for now",
            [{ text: "OK", onPress: () => {} }]
        );
    }
    return (
        <>
            <TouchableOpacity style={styles.conversationPeek} onPress={() => { navigation.navigate('Conversation', { data: {peer_user: data.other_user} }) }}>
                <Avatar.Image size={55} style={styles.profilePicContainer}
                    source={{ uri: data.other_user.pic }}
                    PlaceholderContent={<ActivityIndicator />} />

                <View style={{ flex: 1}}>
                    <Text style={[globalStyle.textInfo, boldIfUnseen]}>{data.other_user.phone_no}</Text>
                    <Text style={[globalStyle.textInfo, boldIfUnseen]}>{lastMessage.message?.substring(0, 50)}</Text>
                </View>
                <View style={{ alignSelf: "center", display: 'flex', flexDirection: 'row', alignItems: 'center', marginHorizontal: 5 }}>
                    <Text style={[globalStyle.textInfo, boldIfUnseen]}> {humanTime(lastMessage.sent_at)} </Text>
                    <Text>{isNew && <FontAwesomeIcon icon={faCircle} size={10} style={{ color: '#34eb46' }} ></FontAwesomeIcon>}</Text>
                </View>
            </TouchableOpacity>
            { isMessageRequest &&
                <View style={[styles.messageRequestContainer, {justifyContent: 'space-evenly'}]}>
                    <Button mode="contained" icon="check" labelStyle={{ fontSize: 12 }} style={[styles.button]}
                        loading={loading === "accept"} disabled={loading === "accept"} onPress={acceptMessageRequest}>Accept</Button>
                    <Button mode="contained" icon="close" labelStyle={{ fontSize: 12 }} style={[styles.button, {backgroundColor: "red"}]} 
                        loading={loading === "reject"} disabled={loading === "reject"} onPress={showError}>Reject</Button>
                </View>
            }
        </>
    )
}

const styles = StyleSheet.create({
    conversationPeek: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10
    }, messageRequestContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 5
    }, profilePicContainer: {
        marginRight: 20
    }, unseenMessage: {
        fontWeight: "bold"
    }, button: {
        width: '45%',
        paddingVertical: 6,
    },
});