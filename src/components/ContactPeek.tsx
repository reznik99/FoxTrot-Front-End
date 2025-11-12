import React, { Component } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Avatar, IconButton, MD2Colors as Colors, ActivityIndicator } from 'react-native-paper';

import globalStyle from '../global/style';
import { DARKHEADER, PRIMARY } from '~/global/variables';
import { UserData } from '~/store/reducers/user';

interface IProps {
    data: UserData;
    loading?: boolean;
    isContact?: boolean;
    onSelect: () => void;
}

export default class ContactPeek extends Component<IProps, any> {
    constructor(props: IProps) {
        super(props);
    }

    render() {
        const { data, onSelect, loading, isContact } = this.props;
        return (
            <TouchableOpacity style={styles.profilePeek} onPress={onSelect}>
                <Avatar.Image size={55} source={{ uri: data.pic }} style={styles.profilePicContainer} />

                <View style={{ flex: 1 }}>
                    <Text style={globalStyle.textInfo}>{data.phone_no}</Text>
                </View>
                {loading && <ActivityIndicator />}
                {isContact
                    ? <IconButton size={25} icon="account" iconColor={PRIMARY} />
                    : <IconButton size={25} icon="account-plus" iconColor={Colors.lightGreen300} />
                }
            </TouchableOpacity>
        );
    }
}

const styles = StyleSheet.create({
    profilePeek: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
    }, profilePicContainer: {
        overflow: 'hidden',
        backgroundColor: DARKHEADER,
        marginRight: 20,
    },
});
