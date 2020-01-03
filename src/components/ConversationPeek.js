import React, { Component } from 'react';
import {View, ScrollView, StyleSheet, ActivityIndicator, Text, TouchableOpacity} from 'react-native';
import { Image } from 'react-native-elements';

const styles = StyleSheet.create({
    conversationPeek: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10
    }, profilePic: {
        borderRadius: 100,
        width: 60,
        height: 60,
        marginRight: 20
    }
});

export default class ConversationPeek extends Component {
    constructor(props){
        super(props);
    }

    render() {
        const lastMessage = this.props.data.messages[this.props.data.messages.length - 1];
        return (
            <TouchableOpacity style={styles.conversationPeek}
                              onPress={() => this.props.navigation.navigate('Conversation', {data: this.props.data})}>
                <View>
                    <Image source={{uri: this.props.data.parties[0].pic}}
                           style={styles.profilePic}
                           PlaceholderContent={<ActivityIndicator />} />
                </View>
                <View style={{flex: 1}}>
                    <Text>{ this.props.data.parties[0].identifier }</Text>
                    <Text>{ lastMessage.content }</Text>
                </View>
                <View style={{alignSelf: "flex-start"}}>
                    <Text>{ lastMessage.when }</Text>
                </View>
            </TouchableOpacity>
        );
    }
}

