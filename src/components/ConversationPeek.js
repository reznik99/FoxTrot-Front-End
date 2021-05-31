import React, { Component } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { Image } from 'react-native-elements';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faCircle } from '@fortawesome/free-solid-svg-icons'

import userData from './../store/userData';
import globalStyle from "../global/globalStyle";

const styles = StyleSheet.create({
    conversationPeek: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10
    }, profilePicContainer: {
        overflow: "hidden",
        borderRadius: Platform.OS === 'ios' ? 150 / 2 : 150,
        marginRight: 20
    }, profilePic: {
        width: 60,
        height: 60,
        borderRadius: Platform.OS === 'ios' ? 150 / 2 : 150,
    }, unseenMessage: {
        fontWeight: "bold"
    }
});

export default class ConversationPeek extends Component {
    constructor(props) {
        super(props);
    }

    // Return style for unseen message only if message wasn't sent by user AND message wasn't seen before
    shouldNotify = (lastMessage) => {
        if (lastMessage.sender != userData.self.phone_no && !lastMessage.seen)
            return true
        return false
    }

    render() {
        const { data, navigation } = this.props
        const lastMessage = data.messages[data.messages.length - 1] || { content: "", sent_at: null }
        const isNew = this.shouldNotify(lastMessage)
        const { boldIfUnseen } = isNew ? { boldIfUnseen: styles.unseenMessage } : { boldIfUnseen: null }

        return (
            <TouchableOpacity style={[styles.conversationPeek]}
                onPress={() => {
                    userData.readMessage(data.parties[0])
                    navigation.navigate('Conversation', { data })
                }}>
                <View style={styles.profilePicContainer}>
                    <Image source={{ uri: data.parties[0].pic || userData.defaultAvatar }}
                        style={styles.profilePic}
                        PlaceholderContent={<ActivityIndicator color="#00FFFF" />} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[globalStyle.textInfo, boldIfUnseen]}>{data.parties[0].phone_no}</Text>
                    <Text style={[globalStyle.textInfo, boldIfUnseen]}>{lastMessage.message}</Text>
                </View>
                <View style={{ alignSelf: "center" }}>
                    <Text style={[globalStyle.textInfo, boldIfUnseen]}>{userData.humanTime(lastMessage.sent_at)}  {isNew && <FontAwesomeIcon icon={faCircle} size={10} style={{ color: '#34eb46' }} ></FontAwesomeIcon>}</Text>
                </View>


            </TouchableOpacity>
        );
    }
}

