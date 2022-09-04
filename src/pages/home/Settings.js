import React, { useEffect, useState, useCallback } from 'react'
import { View, ScrollView } from 'react-native'
import { Button, Switch, Checkbox, Title, Snackbar, Paragraph, Dialog, Portal, Chip, List, Text } from 'react-native-paper'
import { useSelector } from 'react-redux'

import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Keychain from 'react-native-keychain';

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
        props.navigation.navigate('Login', { data: { loggedOut: true } })
    }, [keys, state])

    return (
        <View style={globalStyle.wrapper}>
            <ScrollView style={{ paddingHorizontal: 50, flex: 1 }}>
                <Title>Storage</Title>

                <View>
                    <Text>Tokens stored on device:</Text>
                    {
                        keys.map((key, idx) => (
                            <List.Item title={key} key={idx} left={props => <List.Icon {...props} icon="account-key" />} />
                        ))
                    }
                </View>
                <Button mode='contained' onPress={() => setVisibleDialog(true)} loading={visibleDialog}>Factory Reset App</Button>
                <Portal>
                    <Dialog visible={visibleDialog} onDismiss={() => setVisibleDialog(false)}>
                        <Dialog.Title>Alert</Dialog.Title>
                        <Dialog.Content>
                            <Paragraph>Are you sure you want to reset your account? All message data will be lost. Keys being removed:</Paragraph>
                            {
                                keys.map((key, idx) => (
                                    <Chip key={idx} icon="account-key">{key}</Chip>
                                ))
                            }
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => setVisibleDialog(false)}>Cancel</Button>
                            <Button onPress={resetApp}>Ok</Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>

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

                <Title>Themes</Title>
                <Button icon="camera">Button</Button>
                <Button icon="account-plus" mode="outlined">Outlined</Button>
                <Button icon="cog" mode="contained">Contained</Button>

                <Title>Crypto</Title>
                <Button icon="toilet" mode="contained" loading={true}>Button</Button>
                <View>
                    <Switch value={isSwitchOn} onValueChange={() => setIsSwitchOn(!isSwitchOn)} />
                    <Checkbox status={checked ? 'checked' : 'unchecked'}
                        onPress={() => setChecked(!checked)} />
                </View>

                {/* SNACKBAR */}
                <Button mode={visibleSnack ? 'contained' : ''} onPress={() => setVisibleSnack(!visibleSnack)}>{visibleSnack ? 'Hide snack' : 'Show snack'}</Button>

                <Snackbar visible={visibleSnack}
                    onDismiss={() => setVisibleSnack(false)}
                    action={{
                        label: 'Undo',
                        onPress: () => {
                            // Do something
                        },
                    }}> Hey there! I'm a Snackbar.
                </Snackbar>
            </ScrollView>
        </View>

    )
}