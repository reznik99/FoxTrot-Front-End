import React, { useCallback } from 'react'
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native'
import { Avatar } from 'react-native-paper'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faCircle } from '@fortawesome/free-solid-svg-icons'
import { useSelector } from 'react-redux'

import { humanTime } from '../global/helper'
import globalStyle from "../global/globalStyle"

const styles = StyleSheet.create({
    conversationPeek: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10
    }, profilePicContainer: {
        marginRight: 20
    }, unseenMessage: {
        fontWeight: "bold"
    }
});

export default function ConversationPeek(props) {

    const user_phone_no = useSelector(state => state.userReducer.phone_no)

    // Return style for unseen message only if message wasn't sent by user AND message wasn't seen before
    const shouldNotify = useCallback((lastMessage) => {
        if (lastMessage.sender != user_phone_no && !lastMessage.seen)
            return true
        return false
    }, [user_phone_no])

    const { data, navigation } = props
    const lastMessage = data.messages[data.messages.length - 1] || { content: "", sent_at: null }
    const isNew = shouldNotify(lastMessage)
    const boldIfUnseen = isNew ? styles.unseenMessage : null

    return (
        <TouchableOpacity style={[styles.conversationPeek]} onPress={() => { navigation.navigate('Conversation', { data }) }}>
            <Avatar.Image size={55} style={styles.profilePicContainer}
                source={{ uri: data.other_user.pic }}
                PlaceholderContent={<ActivityIndicator color="#00FFFF" />} />

            <View style={{ flex: 1 }}>
                <Text style={[globalStyle.textInfo, boldIfUnseen]}>{data.other_user.phone_no}</Text>
                <Text style={[globalStyle.textInfo, boldIfUnseen]}>{lastMessage.message}</Text>
            </View>
            <View style={{ alignSelf: "center" }}>
                <Text style={[globalStyle.textInfo, boldIfUnseen]}>{humanTime(lastMessage.sent_at)}  {isNew && <FontAwesomeIcon icon={faCircle} size={10} style={{ color: '#34eb46' }} ></FontAwesomeIcon>}</Text>
            </View>


        </TouchableOpacity>
    )
}

