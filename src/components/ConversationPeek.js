import React, { Component } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { Image } from 'react-native-elements';

import userData from './../store/userData';

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
        borderBottomColor: 'green',
        borderBottomWidth: 1
    }
});

export default class ConversationPeek extends Component {
    constructor(props) {
        super(props);
    }


    render() {
        const { data, navigation } = this.props
        const lastMessage = data.messages[data.messages.length - 1] || { content: "", sent_at: null };
        const boldIfUnseen = lastMessage.seen ? null : { fontWeight: "bold" }
        const messageTime = lastMessage.sent_at ? userData.humanTime(lastMessage.sent_at) : null
        return (
            <TouchableOpacity style={[styles.conversationPeek, !lastMessage.seen ? styles.unseenMessage : null]}
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
                    <Text style={boldIfUnseen}>{data.parties[0].phone_no}</Text>
                    <Text style={boldIfUnseen}>{lastMessage.message}</Text>
                </View>
                <View style={{ alignSelf: "flex-start" }}>
                    <Text style={boldIfUnseen}>{messageTime}</Text>
                </View>
            </TouchableOpacity>
        );
    }
}

