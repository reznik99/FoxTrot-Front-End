import React, { useState, useCallback } from 'react';
import { StyleSheet, ScrollView, View, ToastAndroid } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Avatar, Button, Chip, Dialog, Icon, Paragraph, Portal } from 'react-native-paper';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import Clipboard from '@react-native-clipboard/clipboard';
import { ThunkDispatch } from 'redux-thunk';
import { AnyAction } from 'redux';

import { SECONDARY, KeypairAlgorithm, DARKHEADER, PRIMARY } from '~/global/variables';
import { logOut } from '~/store/actions/auth';
import { publicKeyFingerprint } from '~/global/crypto';
import { RootState } from '~/store/store';

interface IProps {
    navigation: any;
}
type AppDispatch = ThunkDispatch<any, any, AnyAction>

export default function Drawer(props: IProps) {

    const state = useSelector((_state: RootState) => _state.userReducer);
    const dispatch = useDispatch<AppDispatch>();
    const [showSecurityCode, setShowSecurityCode] = useState(false);
    const [securityCode, setSecurityCode] = useState('');

    const copySecurityCode = useCallback(() => {
        setShowSecurityCode(false);
        Clipboard.setString(securityCode);
        ToastAndroid.show(
            'Security Code Copied',
            ToastAndroid.SHORT
        );
    }, [securityCode]);

    return (
        <DrawerContentScrollView contentContainerStyle={{ height: '100%', backgroundColor: SECONDARY }} {...props}>
            <ScrollView contentContainerStyle={{ flex: 1, flexDirection: 'column' }}>

                <View style={[styles.profileContainer]}>
                    <Avatar.Image size={120} source={{ uri: state.user_data.pic }} style={{ backgroundColor: DARKHEADER, marginBottom: 25 }} />
                    <View style={{ backgroundColor: DARKHEADER, width: '100%' }}>
                        <View style={styles.profileInfo}>
                            <Chip icon="phone-forward" style={{ backgroundColor: DARKHEADER }}>{state.user_data?.phone_no}</Chip>
                        </View>
                        <View style={styles.profileInfo}>
                            <Chip icon="account" style={{ backgroundColor: DARKHEADER }}>Contacts: {state.contacts?.length}</Chip>
                        </View>
                        <View style={styles.profileInfo}>
                            <Chip icon="account-key" style={{ backgroundColor: DARKHEADER }}>Keys: {KeypairAlgorithm.name + ' ' + KeypairAlgorithm.namedCurve}</Chip>
                        </View>
                    </View>
                </View>

                <View style={{ width: '100%' }}>
                    <DrawerItem
                        inactiveTintColor="#fff"
                        label="Security Code"
                        style={{ backgroundColor: PRIMARY }}
                        onPress={() => { setShowSecurityCode(true); publicKeyFingerprint(state.user_data.public_key || '').then(setSecurityCode).catch(err => console.error(err)); }}
                        icon={({ size, color }) => (
                            <Icon source="lock" color={color} size={size}/>
                        )}
                    />
                    <DrawerItem
                        inactiveTintColor="#fff"
                        label="Settings"
                        style={{ backgroundColor: PRIMARY }}
                        onPress={() => props.navigation.navigate('Settings')}
                        icon={({ size, color }) => (
                            <Icon source="cog" color={color} size={size}/>
                        )}
                    />
                    <DrawerItem
                        inactiveTintColor="#fff"
                        label="Logout"
                        style={{ borderTopWidth: 1, borderTopColor: '#e3e1e1', backgroundColor: DARKHEADER }}
                        onPress={() => dispatch(logOut(props.navigation))}
                        icon={({ size, color }) => (
                            <Icon source="logout" color={color} size={size}/>
                        )}
                    />
                </View>

            </ScrollView >

            <Portal>
                <Dialog visible={showSecurityCode} onDismiss={() => setShowSecurityCode(false)}>
                    <Dialog.Title>
                        <Icon source="lock" color="#00ff00" size={20}/> Your Security Code
                    </Dialog.Title>
                    <Dialog.Content>
                        {securityCode.match(/.{1,24}/g)?.map((val, idx) => (
                            <Paragraph key={idx} style={{ fontFamily: 'Roboto', textAlign: 'center' }}>{val}</Paragraph>
                        ))}
                    </Dialog.Content>
                    <Dialog.Actions style={{ justifyContent: 'space-evenly' }}>
                        <Button onPress={() => setShowSecurityCode(false)} mode="text" style={{ paddingHorizontal: 15 }}>OK</Button>
                        <Button onPress={() => copySecurityCode()} mode="contained" style={{ paddingHorizontal: 15 }}>Copy Code</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

        </DrawerContentScrollView >
    );
}

const styles = StyleSheet.create({
    profileContainer: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        paddingVertical: 30,
    },
    profileInfo: {
        marginVertical: 5,
    },
});
