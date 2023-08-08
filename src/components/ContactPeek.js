import React, { Component } from 'react'
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native'
import { Avatar, IconButton, Colors, ActivityIndicator } from 'react-native-paper'

import { humanTime } from '../global/helper'
import globalStyle from "../global/style"
import { DARKHEADER, PRIMARY } from '~/global/variables'

const styles = StyleSheet.create({
    profilePeek: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
    }, profilePicContainer: {
        overflow: "hidden",
        backgroundColor: DARKHEADER,
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
            <TouchableOpacity style={styles.profilePeek} onPress={isContact ? null : onSelect}>
                <Avatar.Image size={55} style={styles.profilePicContainer}
                    source={{ uri: data.pic }} PlaceholderContent={<ActivityIndicator />} />

                <View style={{ flex: 1 }}>
                    <Text style={globalStyle.textInfo}>{data.identifier || data.phone_no}</Text>
                </View>
                {loading && <ActivityIndicator />}
                <View>
                    <Text style={globalStyle.textInfo}>{data.lastActive ? humanTime(data.lastActive) : null}</Text>
                </View>
                {data.isContact
                    ? <IconButton icon="account" color={PRIMARY} size={25} />
                    : <IconButton icon="account-plus" color={Colors.lightGreen300} size={25} />
                }
            </TouchableOpacity>
        );
    }
}

