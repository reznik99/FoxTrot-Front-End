import React, { useEffect, useState, useCallback } from 'react'
import { View, ScrollView, Alert, PermissionsAndroid } from 'react-native'
import { useSelector } from 'react-redux'
import { Button, Switch, Checkbox, Title, Paragraph, Dialog, Portal, Chip, List, Text, TextInput, Divider } from 'react-native-paper'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faExclamationTriangle, faDownload, faUpload } from "@fortawesome/free-solid-svg-icons"
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Keychain from 'react-native-keychain'
import { Buffer } from 'buffer'
import RNFS from 'react-native-fs'
import DocumentPicker from 'react-native-document-picker'
import Toast from 'react-native-toast-message'

import globalStyle from "~/global/globalStyle"
import { RootState } from '~/store/store'
import { deriveKeyFromPassword, exportKeypair } from '~/global/crypto'

export default function Settings(props: any) {

    const user_data = useSelector((state: RootState) => state.userReducer.user_data)
    const keypair = useSelector((state: RootState) => state.userReducer.keys)

    const [keys, setKeys] = useState([] as string[])
    const [visibleDialog, setVisibleDialog] = useState('')
    const [encPassword, setEncPassword] = useState('')

    // Testing stuff
    const [isSwitchOn, setIsSwitchOn] = useState(false)
    const [checked, setChecked] = useState(false)
    const [expanded, setExpanded] = useState(true)

    useEffect(() => {
        AsyncStorage.getAllKeys()
            .then(keys => setKeys([...keys]))
            .catch(err => console.error("Error loading AsyncStorage items", err))
    }, [])

    const resetApp = useCallback(() => {
        setVisibleDialog('')
        AsyncStorage.multiRemove(keys)
        Keychain.resetInternetCredentials(`${user_data?.phone_no}-keys`)
        Keychain.resetGenericPassword({service: `${user_data?.phone_no}-password`})
        props.navigation.navigate('Login', { data: { loggedOut: true } })
    }, [keys, user_data])

    const resetValue = useCallback(async (key: string) => {
        console.log("Deleting:", key)
        await AsyncStorage.removeItem(key)
        setKeys(keys.filter(k => k !== key))
    }, [keys])

    const importKeys = async () => {
        if(!encPassword?.trim()) return

        try {
            const path = await DocumentPicker.pickSingle({copyTo: 'documentDirectory'})
            if (!path.fileCopyUri) return

            const file = await RNFS.readFile(decodeURIComponent(path.fileCopyUri))

            // Read PBKDF2 no. of iterations, salt, IV and Ciphertext
            const [_, iter, salt, iv, ciphertext] = file.split("\n")
            const derivedKEK = await deriveKeyFromPassword(encPassword, Buffer.from(salt, 'base64'), parseInt(iter))

            console.debug("Ikeys file: \n", file)

            // Decrypt Keypair
            const Ikeys = await crypto.subtle.decrypt(
                { name: "AES-GCM", iv: Buffer.from(iv, 'base64') },
                derivedKEK,
                Buffer.from(ciphertext, 'base64'),
            );

            // TODO: Parse keypair as json, store in keychain and load into redux store
            
            Toast.show({
                type: 'success',
                text1: 'Succesfully imported Keys',
                text2: 'Messaging and Decryption can now be performed',
                visibilityTime: 6000
            });

        } catch(err: any) {
            console.error("Error importing user keys:", err)
            Alert.alert("Failed to import keys", err.message || err,
                [{ text: "OK", onPress: () => {} }]
            );
        } finally {
            setVisibleDialog('')
            setEncPassword('')
        }
    }

    const exportKeys = async () => {
        if(!encPassword?.trim() || !keypair) return

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
            if(granted !== PermissionsAndroid.RESULTS.GRANTED) return

            const fullPath = RNFS.DownloadDirectoryPath + `/${user_data.phone_no}-keys.txt`
            await RNFS.writeFile(fullPath, file)

            Toast.show({
                type: 'success',
                text1: 'Succesfully exported Keys',
                text2: `Saved the encrypted keys to ${fullPath}`,
                visibilityTime: 6000
            });
        } catch(err: any) {
            console.error("Error exporting user keys:", err)
            Alert.alert("Failed to export keys", err.message || err,
                [{ text: "OK", onPress: () => {} }]
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
                <View style={{marginVertical: 15}}>
                    <Text>Stored on device:</Text>
                    <Chip icon="key">{user_data?.phone_no}-keys</Chip>
                    <Chip icon="account-key">{user_data?.phone_no}-password</Chip>
                    { keys.map((key, idx) => <Chip key={idx} onPress={() => resetValue(key)} icon="account">{key}</Chip> ) }

                    <Button mode='contained' onPress={() => setVisibleDialog('reset')} loading={visibleDialog === 'reset'} style={{marginTop: 10}}>
                        Factory Reset App
                    </Button>
                </View>

                <Divider style={{marginVertical: 15}}/>
                <Title>User Identity Keys</Title>
                <View style={{marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between'}}>
                    <Button icon="upload" mode='contained' onPress={() => setVisibleDialog('import')} loading={visibleDialog === 'import'}>Import</Button>
                    <Button icon="download" mode='contained' onPress={() => setVisibleDialog('export')} loading={visibleDialog === 'export'}>Export</Button>
                </View>
            </ScrollView>

            <Portal>
                <Dialog visible={visibleDialog === 'reset'} onDismiss={() => setVisibleDialog('')}>
                    <Dialog.Title><FontAwesomeIcon icon={faExclamationTriangle} color="yellow"/> Warning</Dialog.Title>
                    <Dialog.Content>
                        <Paragraph>All message data will be lost.</Paragraph>
                        <Paragraph>If you plan to login from another device. Ensure you have exported your Keys!</Paragraph>
                    </Dialog.Content>
                    <Dialog.Actions style={{justifyContent: 'space-between'}}>
                        <Button onPress={() => setVisibleDialog('')}>Cancel</Button>
                        <Button onPress={resetApp} mode='contained' color='yellow'>Clear App Data</Button>
                    </Dialog.Actions>
                </Dialog>

                <Dialog visible={visibleDialog === 'import'} onDismiss={() => setVisibleDialog('')}>
                    <Dialog.Title><FontAwesomeIcon icon={faUpload} color="white"/> Import User Identity Keys</Dialog.Title>
                    <Dialog.Content>
                        <TextInput label="Keypair decryption password" secureTextEntry={true}
                            value={encPassword} onChangeText={setEncPassword} />
                    </Dialog.Content>
                    <Dialog.Actions style={{justifyContent: 'space-between'}}>
                        <Button onPress={() => setVisibleDialog('')}>Cancel</Button>
                        <Button onPress={importKeys} icon='upload' mode='contained' disabled={!encPassword?.trim()}>Import</Button>
                    </Dialog.Actions>
                </Dialog>

                <Dialog visible={visibleDialog === 'export'} onDismiss={() => setVisibleDialog('')}>
                    <Dialog.Title><FontAwesomeIcon icon={faDownload} color="white"/> Export User Identity Keys</Dialog.Title>
                    <Dialog.Content>
                        <TextInput label="Keypair encryption password" secureTextEntry={true}
                            value={encPassword} onChangeText={setEncPassword} />
                    </Dialog.Content>
                    <Dialog.Actions style={{justifyContent: 'space-between'}}>
                        <Button onPress={() => setVisibleDialog('')}>Cancel</Button>
                        <Button onPress={exportKeys} icon='download' mode='contained' disabled={!encPassword?.trim() || !keypair}>Export</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

        </View>
    )
}