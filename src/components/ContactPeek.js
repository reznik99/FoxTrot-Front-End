import React, { Component } from 'react'
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native'
import { Avatar } from 'react-native-paper'

import userData from './../store/userData'
import globalStyle from "../global/globalStyle"

const styles = StyleSheet.create({
    profilePeek: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#1F1D21'
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
        const { data, onSelect } = this.props
        return (
            <TouchableOpacity style={styles.profilePeek}
                onPress={onSelect}>
                <Avatar.Image size={55} style={styles.profilePicContainer}
                    source={{ uri: data.pic || userData.defaultAvatar }}
                    PlaceholderContent={<ActivityIndicator color="#00FFFF" />} />

                <View style={{ flex: 1 }}>
                    <Text style={globalStyle.textInfo}>{data.identifier || data.phone_no}</Text>
                </View>
                <View>
                    <Text style={globalStyle.textInfo}>{data.lastActive ? userData.humanTime(data.lastActive) : null}</Text>
                </View>
            </TouchableOpacity>
        );
    }
}

