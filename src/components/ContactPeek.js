import React, { Component } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { Image } from 'react-native-elements';

import userData from './../store/userData';
import globalStyle from "../global/globalStyle";

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
        const { navigation, data, onSelect } = this.props
        return (
            <TouchableOpacity style={styles.profilePeek}
                onPress={onSelect}>
                <View style={styles.profilePicContainer}>
                    <Image source={{ uri: data.pic || userData.defaultAvatar }}
                        style={styles.profilePic}
                        PlaceholderContent={<ActivityIndicator color="#00FFFF" />} />
                </View>
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

