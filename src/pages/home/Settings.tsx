import React, { useEffect, useState, useCallback } from 'react'
import { View, ScrollView, Alert, PermissionsAndroid } from 'react-native'
import { Button, Title, Paragraph, Dialog, Portal, Chip, Text, TextInput, Divider, Switch } from 'react-native-paper'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faExclamationTriangle, faDownload, faUpload } from "@fortawesome/free-solid-svg-icons"
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Keychain from 'react-native-keychain'
import DocumentPicker from 'react-native-document-picker'
import Toast from 'react-native-toast-message'
import RNFS from 'react-native-fs'
import { AnyAction } from "redux"
import { useDispatch, useSelector } from 'react-redux'
import { ThunkDispatch } from 'redux-thunk'
import { Buffer } from 'buffer'

import globalStyle from "~/global/style"
import { RootState } from '~/store/store'
import { deriveKeyFromPassword, exportKeypair } from '~/global/crypto'
import { ACCENT, DARKHEADER, KeychainOpts } from '~/global/variables'
import { loadContacts, loadKeys } from '~/store/actions/user'
import { logOut } from '~/store/actions/auth'
import { deleteFromStorage } from '~/global/storage'

type AppDispatch = ThunkDispatch<any, any, AnyAction>

export default function Settings(props: any) {

    const dispatch = useDispatch<AppDispatch>()
    const user_data = useSelector((state: RootState) => state.userReducer.user_data)
    const keypair = useSelector((state: RootState) => state.userReducer.keys)

    const [keys, setKeys] = useState<string[]>([])
    const [hasIdentityKeys, setHasIdentityKeys] = useState(false)
    const [hasPassword, setHasPassword] = useState(false)
    const [visibleDialog, setVisibleDialog] = useState('')
    const [encPassword, setEncPassword] = useState('')
    const [showAllKeys, setShowAllKeys] = useState(false)

    useEffect(() => {
        loadAllDeviceData()
    }, [showAllKeys])

    const loadAllDeviceData = useCallback(() => {
        AsyncStorage.getAllKeys()
        .then(keys => keys.filter(key => showAllKeys || !key.includes("-chunk")))
        .then(keys => setKeys([...keys]))
        .catch(err => console.error("Error loading AsyncStorage items:", err))
    Keychain.hasInternetCredentials(`${user_data.phone_no}-keys`)
        .then(hasKeys => setHasIdentityKeys(Boolean(hasKeys)))
        .catch(err => console.error("Error checking TPM for keys:", err))
    Keychain.getGenericPassword({ service: `${user_data.phone_no}-password` })
        .then(hasPassword => setHasPassword(Boolean(hasPassword)))
        .catch(err => console.error("Error checking TPM for password:", err))
    }, [showAllKeys, user_data])

    const resetApp = useCallback(() => {
        setVisibleDialog('')
        // Delete everything from the device
        Promise.all([
            deleteFromStorage(''),
            Keychain.resetInternetCredentials(`${user_data?.phone_no}-keys`),
            Keychain.resetGenericPassword({ service: `${user_data?.phone_no}-password` }),
            dispatch(logOut)
        ])
    }, [user_data])

    const resetValue = useCallback(async (key: string) => {
        console.debug("Deleting:", key)
        await deleteFromStorage(key)
        setKeys(keys.filter(k => k !== key))
    }, [keys])

    const importKeys = async () => {
        if (!encPassword?.trim()) return

        try {
            // Read encrypted key file
            console.debug("Reading Encrypted keypair file...")
            const path = await DocumentPicker.pickSingle({ copyTo: 'documentDirectory' })
            if (!path.fileCopyUri) return
            const file = await RNFS.readFile(decodeURIComponent(path.fileCopyUri))

            // Parse PBKDF2 no. of iterations, salt, IV and Ciphertext and re-generate encryption key
            console.debug("Deriving key encryption key from password...")
            const [_, iter, salt, iv, ciphertext] = file.split("\n")
            const derivedKEK = await deriveKeyFromPassword(encPassword, Buffer.from(salt, 'base64'), parseInt(iter))

            // Decrypt Keypair
            console.debug("Decrypting keypair file...")
            const Ikeys = await crypto.subtle.decrypt(
                { name: "AES-GCM", iv: Buffer.from(iv, 'base64') },
                derivedKEK,
                Buffer.from(ciphertext, 'base64'),
            );

            // Store on device
            console.debug("Saving keys into TPM...")
            await Keychain.setInternetCredentials(`${user_data.phone_no}-keys`, `${user_data.phone_no}-keys`, Buffer.from(Ikeys).toString(), {
                accessControl: Keychain.ACCESS_CONTROL.DEVICE_PASSCODE,
                authenticationPrompt: KeychainOpts.authenticationPrompt,
                storage: Keychain.STORAGE_TYPE.AES,
            })

            // Load into redux store
            console.debug("Loading keys into App...")
            const success = await dispatch(loadKeys())
            if (!success) throw new Error("Failed to load imported keys into app")

            // TODO: Validate that public key locally matches public key on Key Server.

            // Reload contacts to re-generate per-conversation encryption keys (ECDHE)
            console.debug("Regenerating Conversation encryption keys...")
            await dispatch(loadContacts())

            Toast.show({
                type: 'success',
                text1: 'Succesfully imported Keys',
                text2: 'Messaging and Decryption can now be performed',
                visibilityTime: 6000
            });

        } catch (err: any) {
            console.error("Error importing user keys:", err)
            Alert.alert("Failed to import keys", err.message ?? err.toString(),
                [{ text: "OK", onPress: () => { } }]
            );
        } finally {
            setVisibleDialog('')
            setEncPassword('')
            loadAllDeviceData()
        }
    }

    const exportKeys = async () => {
        if (!encPassword?.trim() || !keypair) return

        try {
            const IKeys = await exportKeypair(keypair)
            const iter = 100000
            const salt = crypto.getRandomValues(new Uint8Array(8));
            const derivedKEK = await deriveKeyFromPassword(encPassword, salt, iter)

            // Encrypt Keypair
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encryptedIKeys = await crypto.subtle.encrypt(
                { name: "AES-GCM", iv: iv },
                derivedKEK,
                Buffer.from(JSON.stringify(IKeys)),
            );

            // Store PBKDF2 no. of iterations, salt, IV and Ciphertext
            const file = "Foxtrot encrypted keys" + '\n'
                + iter + '\n'
                + Buffer.from(salt).toString('base64') + '\n'
                + Buffer.from(iv).toString('base64') + '\n'
                + Buffer.from(encryptedIKeys).toString('base64')

            console.debug("File: \n", file)

            const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) return

            const fullPath = RNFS.DownloadDirectoryPath + `/${user_data.phone_no}-keys.txt`
            await RNFS.writeFile(fullPath, file)

            Toast.show({
                type: 'success',
                text1: 'Succesfully exported Keys',
                text2: `Saved the encrypted keys to ${fullPath}`,
                visibilityTime: 6000
            });
        } catch (err: any) {
            console.error("Error exporting user keys:", err)
            Alert.alert("Failed to export keys", err.message ?? err.toString(),
                [{ text: "OK", onPress: () => { } }]
            );
        } finally {
            setVisibleDialog('')
            setEncPassword('')
        }
    }

    return (
        <View style={globalStyle.wrapper}>

            <ScrollView style={{ paddingHorizontal: 40, paddingVertical: 15, marginBottom: 15, flex: 1 }}>
                <Title>User Data</Title>
                <View style={{ marginVertical: 15 }}>
                    <Text>Stored on device:</Text>
                    {/* TPM values */}
                    {hasIdentityKeys && <Chip icon="key" style={{ backgroundColor: DARKHEADER }}>{user_data?.phone_no}-keys</Chip>}
                    {hasPassword && <Chip icon="account-key" style={{ backgroundColor: DARKHEADER }}>{user_data?.phone_no}-password</Chip>}
                    {/* Storage values */}
                    {keys.map((key, idx) => <Chip icon="account" style={{ backgroundColor: DARKHEADER }} key={idx} onPress={() => resetValue(key)}>{key}</Chip>)}

                    <Button mode='contained'
                        icon="alert"
                        color={ACCENT}
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

                <Divider style={{ marginVertical: 15 }} />

                <Title>User Identity Keys</Title>
                <View style={{ marginVertical: 15, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Button icon="upload" mode='contained'
                        onPress={() => setVisibleDialog('import')} loading={visibleDialog === 'import'}>
                        Import
                    </Button>
                    <Button icon="download" mode='contained'
                        onPress={() => setVisibleDialog('export')} loading={visibleDialog === 'export'}>
                        Export
                    </Button>
                </View>
            </ScrollView>

            <Portal>
                <Dialog visible={visibleDialog === 'reset'} onDismiss={() => setVisibleDialog('')}>
                    <Dialog.Title><FontAwesomeIcon icon={faExclamationTriangle} color="yellow" /> Warning</Dialog.Title>
                    <Dialog.Content>
                        <Paragraph>All message data will be lost.</Paragraph>
                        <Paragraph>If you plan to login from another device. Ensure you have exported your Keys!</Paragraph>
                    </Dialog.Content>
                    <Dialog.Actions style={{ justifyContent: 'space-between' }}>
                        <Button onPress={() => setVisibleDialog('')}>Cancel</Button>
                        <Button onPress={resetApp} mode='contained' color='yellow'>Clear App Data</Button>
                    </Dialog.Actions>
                </Dialog>

                <Dialog visible={visibleDialog === 'import'} onDismiss={() => setVisibleDialog('')}>
                    <Dialog.Title><FontAwesomeIcon icon={faUpload} color="white" /> Import User Identity Keys</Dialog.Title>
                    <Dialog.Content>
                        <TextInput label="Keypair decryption password" secureTextEntry={true}
                            value={encPassword} onChangeText={setEncPassword} />
                    </Dialog.Content>
                    <Dialog.Actions style={{ justifyContent: 'space-between' }}>
                        <Button onPress={() => setVisibleDialog('')}>Cancel</Button>
                        <Button onPress={importKeys} icon='upload' mode='contained' disabled={!encPassword?.trim()}>Import</Button>
                    </Dialog.Actions>
                </Dialog>

                <Dialog visible={visibleDialog === 'export'} onDismiss={() => setVisibleDialog('')}>
                    <Dialog.Title><FontAwesomeIcon icon={faDownload} color="white" /> Export User Identity Keys</Dialog.Title>
                    <Dialog.Content>
                        <TextInput label="Keypair encryption password" secureTextEntry={true}
                            value={encPassword} onChangeText={setEncPassword} />
                    </Dialog.Content>
                    <Dialog.Actions style={{ justifyContent: 'space-between' }}>
                        <Button onPress={() => setVisibleDialog('')}>Cancel</Button>
                        <Button onPress={exportKeys} icon='download' mode='contained' disabled={!encPassword?.trim() || !keypair}>Export</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

        </View>
    )
}