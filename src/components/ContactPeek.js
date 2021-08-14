import React, { Component } from 'react'
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native'
import { Avatar, Button, IconButton, Colors } from 'react-native-paper'

import { humanTime } from '../global/helper'
import globalStyle from "../global/globalStyle"

const styles = StyleSheet.create({
    profilePeek: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
    }, profilePicContainer: {
        overflow: "hidden",
        marginRight: 20
    }
});

export default class ContactPeek extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const { data, onSelect, loading, isContact } = this.props
        return (
            <TouchableOpacity style={styles.profilePeek}
                onPress={isContact ? null : onSelect}>
                <Avatar.Image size={55} style={styles.profilePicContainer}
                    source={{ uri: data.pic }}
                    PlaceholderContent={<ActivityIndicator color="#00FFFF" />} />

                <View style={{ flex: 1 }}>
                    <Text style={globalStyle.textInfo}>{data.identifier || data.phone_no}</Text>
                </View>
                {loading
                    ? <ActivityIndicator color="#00FFFF" />
                    : null
                }
                <View>
                    <Text style={globalStyle.textInfo}>{data.lastActive ? humanTime(data.lastActive) : null}</Text>
                </View>
                {data.isContact
                    ? <IconButton icon="account" color={Colors.blue800} size={25} />
                    : <IconButton icon="account-plus" color={Colors.lightGreen300} size={25} />
                }
            </TouchableOpacity>
        );
    }
}

