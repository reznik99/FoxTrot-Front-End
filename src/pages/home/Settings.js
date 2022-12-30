import React, { useEffect, useState, useCallback } from 'react'
import { View, ScrollView, Alert } from 'react-native'
import { useSelector } from 'react-redux'
import { Button, Switch, Checkbox, Title, Snackbar, Paragraph, Dialog, Portal, Chip, List, Text, Divider } from 'react-native-paper'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons"
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Keychain from 'react-native-keychain'

import globalStyle from "~/global/globalStyle"

export default function Settings(props) {

    const state = useSelector(state => state.userReducer)

    const [isSwitchOn, setIsSwitchOn] = useState(false)
    const [visibleSnack, setVisibleSnack] = useState(false)
    const [visibleDialog, setVisibleDialog] = useState(false)
    const [checked, setChecked] = useState(false)
    const [expanded, setExpanded] = useState(true)
    const [keys, setKeys] = useState([])

    useEffect(() => {
        AsyncStorage.getAllKeys((err, keys) => setKeys(keys))
    }, [])

    const resetApp = useCallback(() => {
        setVisibleDialog(false)
        AsyncStorage.multiRemove(keys)
        Keychain.resetInternetCredentials(`${state.user_data?.phone_no}-keys`)
        Keychain.resetGenericPassword(`${state.user_data?.phone_no}-password`)
        props.navigation.navigate('Login', { data: { loggedOut: true } })
    }, [keys, state])

    const importKeys = () => {
        // TODO
        Alert.alert("Not Implemented",
        "This feature has not yet been implemented",
            [{ text: "OK", onPress: () => {} }]
        );
    }

    const exportKeys = () => {
        // TODO
        Alert.alert("Not Implemented",
            "This feature has not yet been implemented",
            [{ text: "OK", onPress: () => {} }]
        );
    }

    return (
        <View style={globalStyle.wrapper}>
            <ScrollView style={{ paddingHorizontal: 40, paddingVertical: 15, marginBottom: 15, flex: 1 }}>
                
                <Title>User Data</Title>
                <View style={{marginVertical: 15}}>
                    <Text>Stored on device:</Text>
                    <Chip icon="key">{state.user_data?.phone_no}-keys</Chip>
                    <Chip icon="account-key">{state.user_data?.phone_no}-password</Chip>
                    { keys.map((key, idx) => <Chip key={idx} icon="account">{key}</Chip> ) }

                    <Button mode='contained' onPress={() => setVisibleDialog(true)} loading={visibleDialog} style={{marginTop: 10}}>
                        Factory Reset App
                    </Button>

                    <Portal>
                        <Dialog visible={visibleDialog} onDismiss={() => setVisibleDialog(false)}>
                            <Dialog.Title><FontAwesomeIcon icon={faExclamationTriangle} color="yellow"/> Warning</Dialog.Title>
                            <Dialog.Content>
                                <Paragraph>All message data will be lost.</Paragraph>
                                <Paragraph>If you plan to login from another device. Ensure you have exported your Keys!</Paragraph>
                            </Dialog.Content>
                            <Dialog.Actions style={{justifyContent: 'space-between'}}>
                                <Button onPress={() => setVisibleDialog(false)}>Cancel</Button>
                                <Button onPress={resetApp} mode='contained' color='yellow'>Clear App Data</Button>
                            </Dialog.Actions>
                        </Dialog>
                    </Portal>
                </View>

                <Divider style={{marginVertical: 15}}/>
                <Title>User Keys</Title>
                <View style={{marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between'}}>
                    <Button icon="upload" mode='contained' onPress={importKeys} loading={visibleDialog}>Import Keys</Button>
                    <Button icon="download" mode='contained' onPress={exportKeys} loading={visibleDialog}>Export Keys</Button>
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
                    <View style={{marginVertical: 10}}>
                        <Button mode={visibleSnack ? 'contained' : ''} onPress={() => setVisibleSnack(!visibleSnack)}>{visibleSnack ? 'Hide snack' : 'Show snack'}</Button>
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

            <Snackbar visible={visibleSnack}
                onDismiss={() => setVisibleSnack(false)}
                action={{
                    label: 'Undo',
                    onPress: () => {},
                }}> Hey there! I'm a Snackbar.
            </Snackbar>
        </View>
    )
}