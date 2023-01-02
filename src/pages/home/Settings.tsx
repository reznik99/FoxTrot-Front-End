import React, { useEffect, useState, useCallback } from 'react'
import { View, ScrollView, Alert } from 'react-native'
import { useSelector } from 'react-redux'
import { Button, Switch, Checkbox, Title, Paragraph, Dialog, Portal, Chip, List, Text, TextInput, Divider } from 'react-native-paper'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faExclamationTriangle, faDownload, faUpload } from "@fortawesome/free-solid-svg-icons"
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Keychain from 'react-native-keychain'
import { Buffer } from 'buffer'
import RNFS from 'react-native-fs'

import globalStyle from "~/global/globalStyle"
import { RootState } from '~/store/store'
import { exportKeypair } from '~/global/crypto'

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
        AsyncStorage.getAllKeys((err, keys) => setKeys(keys ? [...keys] : []))
    }, [])

    const resetApp = useCallback(() => {
        setVisibleDialog('')
        AsyncStorage.multiRemove(keys)
        Keychain.resetInternetCredentials(`${user_data?.phone_no}-keys`)
        Keychain.resetGenericPassword({service: `${user_data?.phone_no}-password`})
        props.navigation.navigate('Login', { data: { loggedOut: true } })
    }, [keys, user_data])

    const importKeys = () => {
        // TODO
        Alert.alert("Not Implemented",
        "This feature has not yet been implemented",
            [{ text: "OK", onPress: () => {} }]
        );
    }

    const exportKeys = async () => {
        if(!encPassword?.trim()) return
        if(!keypair) return

        try {
            // Derive Key from password using PBKDF2
            const keyMaterial = await crypto.subtle.importKey(
                "raw",
                Buffer.from(encPassword),
                "PBKDF2",
                false,
                ["deriveBits", "deriveKey"],
            );
            
            const salt = crypto.getRandomValues(new Uint8Array(8));
            const key = await crypto.subtle.deriveKey(
                {
                name: "PBKDF2",
                salt,
                iterations: 100000,
                hash: "SHA-256",
                },
                keyMaterial,
                { name: "AES-GCM", length: 256},
                true,
                ["encrypt", "decrypt"],
            );

            // Encrypt Keypair
            const userKeys = await exportKeypair(keypair)
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encryptedKeys = await crypto.subtle.encrypt(
                { name: "AES-GCM", iv },
                key,
                Buffer.from(JSON.stringify(userKeys)),
            );

            console.log("Encrypted keys: ", Buffer.from(encryptedKeys).toString('base64'))
            
            const file = "Foxtrot encrypted keys" + '\n' + Buffer.from(iv).toString('base64') + '\n' + Buffer.from(encryptedKeys).toString('base64')

            RNFS.writeFile(RNFS.DownloadDirectoryPath + `foxtrot-${user_data.phone_no}.keys`, file)
        } catch(err) {
            console.error("Error exporting user keys:", err)
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
                    { keys.map((key, idx) => <Chip key={idx} icon="account">{key}</Chip> ) }

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

                <Divider style={{marginVertical: 15}}/>
                <Title><FontAwesomeIcon icon={faExclamationTriangle} color="yellow" /> Testing area</Title>
                <List.Section title="Form Components">
                    <View style={{marginVertical: 5}}>
                        <Button icon="camera">Button</Button>
                        <Button icon="account-plus" mode="outlined">Outlined</Button>
                        <Button icon="cog" mode="contained">Contained</Button>
                        <Button icon="toilet" mode="contained" loading={true}>Loading</Button>
                    </View>
                    <View style={{marginVertical: 5, alignItems: 'flex-start'}}>
                        <Switch value={isSwitchOn} onValueChange={() => setIsSwitchOn(!isSwitchOn)} />
                        <Checkbox status={checked ? 'checked' : 'unchecked'} onPress={() => setChecked(!checked)} />
                    </View>
                </List.Section>

                <List.Section title="Accordions">
                    <List.Accordion
                        title="Controlled Accordion"
                        left={props => <List.Icon {...props} icon="folder" />}
                        expanded={expanded}
                        onPress={() => setExpanded(!expanded)}>
                        <List.Item title="First item" />
                        <List.Item title="Second item" />
                    </List.Accordion>
                </List.Section>

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
                        <TextInput label="Keypair decryption password" value={encPassword} onChangeText={text => setEncPassword(text)} />
                    </Dialog.Content>
                    <Dialog.Actions style={{justifyContent: 'space-between'}}>
                        <Button onPress={() => setVisibleDialog('')}>Cancel</Button>
                        <Button onPress={importKeys} icon='upload' mode='contained'>Import</Button>
                    </Dialog.Actions>
                </Dialog>

                <Dialog visible={visibleDialog === 'export'} onDismiss={() => setVisibleDialog('')}>
                    <Dialog.Title><FontAwesomeIcon icon={faDownload} color="white"/> Export User Identity Keys</Dialog.Title>
                    <Dialog.Content>
                        <TextInput label="Keypair encryption password" value={encPassword} onChangeText={text => setEncPassword(text)} />
                    </Dialog.Content>
                    <Dialog.Actions style={{justifyContent: 'space-between'}}>
                        <Button onPress={() => setVisibleDialog('')}>Cancel</Button>
                        <Button onPress={exportKeys} icon='download' mode='contained'>Export</Button>
                    </Dialog.Actions>
                </Dialog>

            </Portal>

        </View>
    )
}