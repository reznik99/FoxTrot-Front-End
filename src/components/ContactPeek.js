import React, { Component } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { Image } from 'react-native-elements';

import userData from './../store/userData';

const styles = StyleSheet.create({
    profilePeek: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'lightgray'
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

export default class ContactPeek extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const { navigation, data } = this.props;
        let conversation = userData.getConversation(data.identifier);
        return (
            <TouchableOpacity style={styles.profilePeek}
                onPress={() => {
                    // If conversation doesn't exist, create one
                    conversation
                        ? this.props.navigation.navigate('Conversation', { data: conversation })
                        : this.props.navigation.navigate('Conversation', { data: userData.createConversation(data) });
                }}>
                <View style={styles.profilePicContainer}>
                    <Image source={{ uri: data.pic }}
                        style={styles.profilePic}
                        PlaceholderContent={<ActivityIndicator color="#00FFFF" />} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text>{data.identifier}</Text>
                </View>
                <View>
                    <Text>{data.lastActive} ago</Text>
                </View>
            </TouchableOpacity>
        );
    }
}

