import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, Alert, StyleSheet } from 'react-native';
import { Button, Dialog, Portal, Chip, Text, TextInput, Divider, Switch, useTheme } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pick, types } from '@react-native-documents/picker';
import { StackScreenProps } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import * as Keychain from 'react-native-keychain';
import QuickCrypto from 'react-native-quick-crypto';
import Toast from 'react-native-toast-message';
import RNFS from 'react-native-fs';
import { Buffer } from 'buffer';

import { getReadExtPermission, getWriteExtPermission } from '~/global/permissions';
import { deriveKeyFromPassword, exportKeypair } from '~/global/crypto';
import { API_URL, DARKHEADER, KeychainOpts, SaltLenGCM, SaltLenPBKDF2 } from '~/global/variables';
import globalStyle from '~/global/style';
import { deleteFromStorage } from '~/global/storage';
import { AppDispatch, RootState } from '~/store/store';
import { loadContacts, loadKeys } from '~/store/actions/user';
import { logOut } from '~/store/actions/auth';
import { HomeStackParamList } from '../../../App';

export default function Settings(_props: StackScreenProps<HomeStackParamList, 'Settings'>) {

    const dispatch = useDispatch<AppDispatch>();
    const user_data = useSelector((state: RootState) => state.userReducer.user_data);
    const keypair = useSelector((state: RootState) => state.userReducer.keys);
    const theme = useTheme()

    const [keys, setKeys] = useState<string[]>([]);
    const [hasIdentityKeys, setHasIdentityKeys] = useState(false);
    const [hasPassword, setHasPassword] = useState(false);
    const [visibleDialog, setVisibleDialog] = useState('');
    const [encPassword, setEncPassword] = useState('');
    const [showAllKeys, setShowAllKeys] = useState(false);

    const loadAllDeviceData = useCallback(() => {
        AsyncStorage.getAllKeys()
            .then(_keys => _keys.filter(key => showAllKeys || !key.includes('-chunk')))
            .then(_keys => setKeys([..._keys]))
            .catch(err => console.error('Error loading AsyncStorage items:', err));
        Keychain.hasInternetCredentials({ server: API_URL, service: `${user_data.phone_no}-keys` })
            .then(_hasKeys => setHasIdentityKeys(Boolean(_hasKeys)))
            .catch(err => console.error('Error checking TPM for keys:', err));
        Keychain.hasGenericPassword({ server: API_URL, service: `${user_data.phone_no}-credentials` })
            .then(_hasPwd => setHasPassword(Boolean(_hasPwd)))
            .catch(err => console.error('Error checking TPM for password:', err));
    }, [showAllKeys, user_data]);

    useEffect(() => {
        loadAllDeviceData();
    }, [showAllKeys, loadAllDeviceData]);

    const resetApp = useCallback(async () => {
        // Require authentication before allowing deletion
        const res = await Keychain.getGenericPassword({
            server: API_URL,
            service: `${user_data.phone_no}-credentials`,
            accessControl: KeychainOpts.accessControl,
            authenticationPrompt: {
                title: 'Authentication required',
            },
        });
        if (!res || !res.password) { return; }

        setVisibleDialog('');
        // Delete everything from the device
        Promise.all([
            deleteFromStorage(''),
            Keychain.resetInternetCredentials({ server: API_URL, service: `${user_data?.phone_no}-keys` }),
            Keychain.resetGenericPassword({ server: API_URL, service: `${user_data?.phone_no}-credentials` }),
            dispatch(logOut({ navigation: _props.navigation as any })),
        ]);
    }, [user_data, dispatch]);

    const resetValue = useCallback(async (key: string) => {
        console.debug('Deleting:', key);
        await deleteFromStorage(key);
        setKeys(keys.filter(k => k !== key));
    }, [keys]);

    const importKeys = async () => {
        if (!encPassword?.trim()) { return; }

        try {
            const hasPermission = await getReadExtPermission();
            if (!hasPermission) {
                throw new Error('Permission to read from external storage denied');
            }
            // Read encrypted key file
            console.debug('Reading Encrypted keypair file...');
            const [fileSelected] = await pick({ type: types.plainText, mode: 'open' });
            if (!fileSelected.uri) { throw new Error('Failed to pick file:' + fileSelected.error || 'unknown'); }

            const file = await RNFS.readFile(fileSelected.uri);

            // Parse PBKDF2 no. of iterations, salt, IV and Ciphertext and re-generate encryption key
            console.debug('Deriving key encryption key from password...');
            const [_, iter, salt, iv, ciphertext] = file.split('\n');
            const derivedKEK = await deriveKeyFromPassword(encPassword, Buffer.from(salt, 'base64'), parseInt(iter, 10));

            // Decrypt Keypair
            console.debug('Decrypting keypair file...');
            let Ikeys = new ArrayBuffer();
            try {
                Ikeys = await QuickCrypto.subtle.decrypt(
                    { name: 'AES-GCM', iv: Buffer.from(iv, 'base64') },
                    derivedKEK,
                    Buffer.from(ciphertext, 'base64'),
                );
            } catch (err) {
                console.error('Decryption error: Invalid password or corrupted file:', err);
                throw new Error('Decryption error: Invalid password or corrupted file');
            }

            // Store on device
            console.debug('Saving keys into TPM...');
            await Keychain.setInternetCredentials(API_URL, `${user_data.phone_no}-keys`, Buffer.from(Ikeys).toString(), {
                storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
                server: API_URL,
                service: `${user_data.phone_no}-keys`,
            });

            // Load into redux store
            console.debug('Loading keys into App...');
            const res = await dispatch(loadKeys());
            if (!res.payload) { throw new Error('Failed to load imported keys into app'); }

            // TODO: Validate that public key locally matches public key on Key Server.

            // Reload contacts to re-generate per-conversation encryption keys (ECDH)
            console.debug('Regenerating Conversation encryption keys...');
            await dispatch(loadContacts({ atomic: true }));

            Toast.show({
                type: 'success',
                text1: 'Succesfully imported Keys',
                text2: 'Messaging and Decryption can now be performed',
                visibilityTime: 6000,
            });

        } catch (err: any) {
            console.error('Error importing user keys:', err);
            Alert.alert('Failed to import keys', err.message ?? err.toString(),
                [{ text: 'OK', onPress: () => { } }]
            );
        } finally {
            setVisibleDialog('');
            setEncPassword('');
            loadAllDeviceData();
        }
    };

    const exportKeys = async () => {
        if (!encPassword?.trim() || !keypair) { return; }

        try {
            const IKeys = await exportKeypair(keypair);
            const iter = 100000;
            const salt = QuickCrypto.getRandomValues(new Uint8Array(SaltLenPBKDF2));
            const derivedKEK = await deriveKeyFromPassword(encPassword, salt, iter);

            // Encrypt Keypair
            const iv = QuickCrypto.getRandomValues(new Uint8Array(SaltLenGCM));
            const encryptedIKeys = await QuickCrypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                derivedKEK,
                Buffer.from(JSON.stringify(IKeys)),
            );

            // Store PBKDF2 no. of iterations, salt, IV and Ciphertext
            const file = 'Foxtrot encrypted keys' + '\n'
                + iter + '\n'
                + Buffer.from(salt).toString('base64') + '\n'
                + Buffer.from(iv).toString('base64') + '\n'
                + Buffer.from(encryptedIKeys).toString('base64');
            console.debug('File: \n', file);

            const hasPermission = await getWriteExtPermission();
            if (!hasPermission) {
                console.error('Permission to write to external storage denied');
                return;
            }

            const fullPath = RNFS.DownloadDirectoryPath + `/${user_data.phone_no}-keys-${Date.now()}.txt`;
            // Delete file first, RNFS bug causes malformed writes if overwriting: https://github.com/itinance/react-native-fs/issues/700
            await RNFS.writeFile(fullPath, file);

            Toast.show({
                type: 'success',
                text1: 'Succesfully exported Keys',
                text2: `Saved the encrypted keys to ${fullPath}`,
                visibilityTime: 6000,
            });
        } catch (err: any) {
            console.error('Error exporting user keys:', err);
            Alert.alert('Failed to export keys', err.message ?? err.toString(),
                [{ text: 'OK', onPress: () => { } }]
            );
        } finally {
            setVisibleDialog('');
            setEncPassword('');
        }
    };

    return (
        <View style={globalStyle.wrapper}>

            <ScrollView style={{ paddingHorizontal: 40, paddingVertical: 15, marginBottom: 15, flex: 1 }}>

                <Text variant="titleMedium">User Identity Keys</Text>
                <View style={{ marginVertical: 15, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Button mode="contained"
                        icon="upload-circle"
                        onPress={() => setVisibleDialog('import')}
                        loading={visibleDialog === 'import'}>
                        Import Keys
                    </Button>
                    <Button mode="contained"
                        icon="download-circle"
                        onPress={() => setVisibleDialog('export')}
                        loading={visibleDialog === 'export'}>
                        Export Keys
                    </Button>
                </View>

                <Divider style={{ marginVertical: 15 }} />

                <Text variant="titleMedium">User Data</Text>
                <View style={{ marginVertical: 15 }}>
                    <Text>Click entry to delete:</Text>
                    {/* TPM values */}
                    {hasIdentityKeys && <Chip icon="key" selected style={{ backgroundColor: DARKHEADER }}>{user_data?.phone_no}-keys</Chip>}
                    {hasPassword && <Chip icon="account-key" selected style={{ backgroundColor: DARKHEADER }}>{user_data?.phone_no}-credentials</Chip>}
                    {/* Storage values */}
                    {keys.map((key, idx) => <Chip icon="account" style={{ backgroundColor: DARKHEADER }} key={idx} onPress={() => resetValue(key)}>{key}</Chip>)}

                    <Button mode="contained"
                        icon="alert-circle"
                        buttonColor={theme.colors.errorContainer}
                        textColor={theme.colors.error}
                        style={{ marginTop: 10 }}
                        onPress={() => setVisibleDialog('reset')}
                        loading={visibleDialog === 'reset'}>
                        Factory Reset App
                    </Button>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                    <Text>Show all db keys in storage</Text>
                    <Switch value={showAllKeys} onValueChange={() => setShowAllKeys(!showAllKeys)} />
                </View>
            </ScrollView>

            <Portal>
                <Dialog visible={visibleDialog === 'reset'} onDismiss={() => setVisibleDialog('')}>
                    <Dialog.Icon icon="flash-triangle" color='yellow' />
                    <Dialog.Title>Factory Reset App</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyMedium">All message data will be lost.</Text>
                        <Text variant="bodyMedium">If you plan to login from another device. Ensure you have exported your Keys!</Text>
                    </Dialog.Content>
                    <Dialog.Actions style={styles.spaceBetween}>
                        <Button mode="contained-tonal" onPress={() => setVisibleDialog('')}>Cancel</Button>
                        <Button mode="contained" onPress={resetApp}>Clear App Data</Button>
                    </Dialog.Actions>
                </Dialog>

                <Dialog visible={visibleDialog === 'import'} onDismiss={() => setVisibleDialog('')}>
                    <Dialog.Icon icon="file-import" />
                    <Dialog.Title style={{ textAlign: 'center' }}>Import Identity Keys</Dialog.Title>
                    <Dialog.Content>
                        <Text>File selection will be prompted after decryption password is provided:</Text>
                        <TextInput label="Keypair decryption password"
                            autoCapitalize="none"
                            secureTextEntry={true}
                            value={encPassword} onChangeText={setEncPassword} />
                    </Dialog.Content>
                    <Dialog.Actions style={styles.spaceBetween}>
                        <Button mode="contained-tonal" onPress={() => setVisibleDialog('')}>Cancel</Button>
                        <Button mode="contained" onPress={importKeys} icon="upload" disabled={!encPassword?.trim()}>Import</Button>
                    </Dialog.Actions>
                </Dialog>

                <Dialog visible={visibleDialog === 'export'} onDismiss={() => setVisibleDialog('')}>
                    <Dialog.Icon icon="file-export" />
                    <Dialog.Title style={{ textAlign: 'center' }}>Export Identity Keys</Dialog.Title>
                    <Dialog.Content>
                        <Text >A weak password can result in account takeover!</Text>
                        <TextInput label="Keypair encryption password"
                            autoCapitalize="none"
                            secureTextEntry={true}
                            value={encPassword} onChangeText={setEncPassword} />
                    </Dialog.Content>
                    <Dialog.Actions style={styles.spaceBetween}>
                        <Button mode="contained-tonal" onPress={() => setVisibleDialog('')}>Cancel</Button>
                        <Button mode="contained" onPress={exportKeys} icon="download" disabled={!encPassword?.trim() || !keypair}>Export</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

        </View>
    );
}

const styles = StyleSheet.create({
    spaceBetween: {
        justifyContent: 'space-between',
    },
});
