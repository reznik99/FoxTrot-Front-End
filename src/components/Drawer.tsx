import React, { useState, useCallback } from 'react';
import { StyleSheet, ScrollView, View, ToastAndroid } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Avatar, Button, Chip, Dialog, Icon, Portal, Text } from 'react-native-paper';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { DrawerContentComponentProps } from '@react-navigation/drawer/lib/typescript/src/types';
import Clipboard from '@react-native-clipboard/clipboard';

import { SECONDARY, KeypairAlgorithm, DARKHEADER, PRIMARY } from '~/global/variables';
import { logOut } from '~/store/actions/auth';
import { publicKeyFingerprint } from '~/global/crypto';
import { AppDispatch, RootState } from '~/store/store';

export default function Drawer(props: DrawerContentComponentProps) {

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

    const loadSecurityCode = useCallback(async () => {
        try {
            setShowSecurityCode(true);
            const code = await publicKeyFingerprint(state.user_data.public_key || '');
            setSecurityCode(code);
        } catch (err) {
            console.error(err);
        }
    }, [state.user_data]);

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

                <View>
                    <DrawerItem inactiveTintColor={PRIMARY}
                        label="Security Code"
                        onPress={() => loadSecurityCode()}
                        icon={renderLockIcon}
                    />
                    <DrawerItem inactiveTintColor={PRIMARY}
                        label="Settings"
                        onPress={() => { props.navigation.navigate('Settings'); props.navigation.closeDrawer(); }}
                        icon={renderCogIcon}
                    />
                    <DrawerItem inactiveTintColor="#fff"
                        label="Logout"
                        style={{ borderTopWidth: 1, borderTopColor: '#e3e1e1', backgroundColor: DARKHEADER }}
                        onPress={() => dispatch(logOut({ navigation: props.navigation as any }))}
                        icon={renderLogoutIcon}
                    />
                </View>

            </ScrollView >

            <Portal>
                <Dialog visible={showSecurityCode} onDismiss={() => setShowSecurityCode(false)}>
                    <Dialog.Icon icon="lock" color="#00ff00" />
                    <Dialog.Title style={{ textAlign: 'center' }}>Your Security Code</Dialog.Title>
                    <Dialog.Content>
                        {securityCode.match(/.{1,24}/g)?.map((val, idx) => (
                            <Text key={idx} style={{ fontFamily: 'Roboto', textAlign: 'center' }}>{val}</Text>
                        ))}
                    </Dialog.Content>
                    <Dialog.Actions style={{ justifyContent: 'space-evenly' }}>
                        <Button mode="contained-tonal"
                            onPress={() => setShowSecurityCode(false)}
                            style={{ paddingHorizontal: 15 }}>Close</Button>
                        <Button mode="contained"
                            onPress={() => copySecurityCode()}
                            icon="content-copy"
                            style={{ paddingHorizontal: 15 }}>Copy</Button>
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

const renderLockIcon = ({ size, color }: { size: number, color: string }) => {
    return <Icon source="lock" color={color} size={size} />;
};

const renderCogIcon = ({ size, color }: { size: number, color: string }) => {
    return <Icon source="cog" color={color} size={size} />;
};

const renderLogoutIcon = ({ size, color }: { size: number, color: string }) => {
    return <Icon source="logout" color={color} size={size} />;
};
