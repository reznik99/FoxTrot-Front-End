import React, { useState } from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { ActivityIndicator, Avatar, Button, Chip, Dialog, Paragraph, Portal } from 'react-native-paper';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faDoorOpen, faCog, faLock } from '@fortawesome/free-solid-svg-icons';

import { KeypairAlgorithm } from '~/global/variables';
import { logOut } from '~/store/actions/auth';
import { publicKeyFingerprint } from '~/global/crypto';

export default function Drawer(props) {

    const state = useSelector(state => state.userReducer)
    const dispatch = useDispatch()
    const [showSecurityCode, setShowSecurityCode] = useState(false)
    const [securityCode, setSecurityCode] = useState('')

    return (
        <DrawerContentScrollView contentContainerStyle={{ height: '100%', backgroundColor: "#222" }} {...props}>
            <ScrollView contentContainerStyle={{ flex: 1, flexDirection: 'column' }}>

                <View style={[styles.profileContainer, { marginBottom: 25 }]}>
                    <Avatar.Image size={150} style={{ marginBottom: 25 }}
                        source={{ uri: state.user_data?.pic }}
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
                    inactiveTintColor="#afa"
                    label="View Security Code"
                    onPress={() => { setShowSecurityCode(true), publicKeyFingerprint(state.user_data.public_key).then(setSecurityCode).catch(err => console.error(err)) }}
                    icon={({ focused, size, color }) => (
                        <FontAwesomeIcon size={size} icon={faLock} style={{ color: color }} />
                    )}
                />
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

            <Portal>
                <Dialog visible={showSecurityCode} onDismiss={() => setShowSecurityCode(false)}>
                    <Dialog.Title>
                        <FontAwesomeIcon icon={faLock} color="#00ff00" /> Your Security Code
                    </Dialog.Title>
                    <Dialog.Content>
                        {securityCode.match(/.{1,24}/g)?.map((val, idx) => (
                            <Paragraph key={idx} style={{ fontFamily: 'Roboto', textAlign: 'center' }}>{val}</Paragraph>
                        ))}
                    </Dialog.Content>
                    <Dialog.Actions style={{ justifyContent: 'space-evenly' }}>
                        <Button onPress={() => setShowSecurityCode(false)} mode='contained' style={{ paddingHorizontal: 15 }}>OK</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

        </DrawerContentScrollView >
    )
}

const styles = StyleSheet.create({
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
})