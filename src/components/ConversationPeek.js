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
    }
});

export default class ConversationPeek extends Component {
    constructor(props) {
        super(props);
    }


    render() {
        const lastMessage = this.props.data.messages[this.props.data.messages.length - 1] || { content: "", when: "" };
        let time = Date.now();
        return (
            <TouchableOpacity style={styles.conversationPeek}
                onPress={() => this.props.navigation.navigate('Conversation', { data: this.props.data })}>
                <View style={styles.profilePicContainer}>
                    <Image source={{ uri: this.props.data.parties[0].pic || userData.defaultAvatar }}
                        style={styles.profilePic}
                        PlaceholderContent={<ActivityIndicator color="#00FFFF" />} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text>{this.props.data.parties[0].identifier || this.props.data.parties[0].phone_no}</Text>
                    <Text>{lastMessage.content}</Text>
                </View>
                <View style={{ alignSelf: "flex-start" }}>
                    {
                        parseInt((time - lastMessage.when) / 1000) > 60
                            ? parseInt((time - lastMessage.when) / 1000 / 60) > 60
                                ? <Text>{parseInt((time - lastMessage.when) / 1000 / 60 / 60)}h ago</Text>
                                : <Text>{parseInt((time - lastMessage.when) / 1000 / 60)}m ago</Text>
                            : <Text>{'<'}1m ago</Text>
                    }
                </View>
            </TouchableOpacity>
        );
    }
}

