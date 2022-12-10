import React from 'react';
import { ScrollView, View } from 'react-native';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faDoorOpen, faCog } from '@fortawesome/free-solid-svg-icons';
import { ActivityIndicator, Avatar, Chip } from 'react-native-paper';
import { KeypairAlgorithm } from '~/global/variables';
import { logOut } from '~/store/actions/auth';

const styles = {
    profileContainer: {
        flex: 0,
        flexDirection: "column",
        alignItems: "center",
        paddingVertical: 30
    },
    profileInfoContainer: {
        flex: 0,
        marginVertical: 10,
        flexDirection: "row",
        textAlign: "right",
        alignItems: "center"
    },
    profileInfo: {
        color: "#fff"
    },
    profileInfoIcon: {
        color: "#fff",
        marginRight: 10,
    }
}

export default function Drawer(props) {
    const state = useSelector(state => state.userReducer)
    const dispatch = useDispatch()

    return (
        <DrawerContentScrollView contentContainerStyle={{ height: '100%', backgroundColor: "#222" }} {...props}>
            <ScrollView contentContainerStyle={{ flex: 1, flexDirection: 'column' }}>

                <View style={[styles.profileContainer, {marginBottom: 25}]}>
                    <Avatar.Image size={150} style={{marginBottom: 25}}
                        source={{ uri: `https://robohash.org/${state.user_data?.id}` }}
                        PlaceholderContent={<ActivityIndicator />} />
                    <View>
                        <View style={styles.profileInfoContainer}>
                            <Chip icon="phone-forward">{state.user_data?.phone_no}</Chip>
                        </View>
                        <View style={styles.profileInfoContainer}>
                            <Chip icon="account">Contacts: {state.contacts?.length}</Chip>
                        </View>
                        <View style={styles.profileInfoContainer}>
                            <Chip icon="account-key">Keys: {KeypairAlgorithm.name + " " + KeypairAlgorithm.namedCurve}</Chip>
                        </View>
                    </View>
                </View>

                <DrawerItem
                    inactiveTintColor="#aaf"
                    label="Settings"
                    onPress={() => props.navigation.navigate('Settings')}
                    icon={({ focused, size, color }) => (
                        <FontAwesomeIcon size={size} icon={faCog} style={{ color: color }} />
                    )}
                />
                <DrawerItem
                    inactiveTintColor="#e60e59"
                    label="Logout"
                    style={{ borderTopWidth: 1, borderTopColor: "#e60e59" }}
                    onPress={() => dispatch(logOut(props.navigation))}
                    icon={({ focused, size, color }) => (
                        <FontAwesomeIcon size={size} icon={faDoorOpen} style={{ color: color }} />
                    )}
                />

            </ScrollView >
        </DrawerContentScrollView >
    )
}