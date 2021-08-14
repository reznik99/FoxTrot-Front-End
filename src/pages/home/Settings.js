import AsyncStorage from '@react-native-community/async-storage'
import React, { useEffect, useState, useCallback } from 'react'
import { View } from 'react-native'
import { Button, Switch, Title, Snackbar, Paragraph, Dialog, Portal, Text, Chip } from 'react-native-paper'
import { useSelector } from 'react-redux'

export default function Settings(props) {

    const state = useSelector(state => state.userReducer)

    const [isSwitchOn, setIsSwitchOn] = useState(false)
    const [visibleSnack, setVisibleSnack] = useState(false)
    const [visibleDialog, setVisibleDialog] = useState(false)
    const [keys, setKeys] = useState([])

    useEffect(() => {
        AsyncStorage.getAllKeys((err, keys) => {
            setKeys(keys)
        })
    }, [])

    const resetApp = useCallback(() => {
        setVisibleDialog(false)
        AsyncStorage.multiRemove(keys)
        props.navigation.navigate('Login', { data: { loggedOut: true } })
    }, [keys])

    return (
        <View style={{ paddingHorizontal: 50, flex: 1 }}>
            <Title>Storage</Title>

            {/* PORTAL */}
            <Button onPress={() => setVisibleDialog(true)}>Factory Reset App</Button>
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

            <Title>Themes</Title>
            <Button icon="camera">Button</Button>
            <Button icon="account-plus" mode="outlined">Outlined</Button>
            <Button icon="cog" mode="contained">Contained</Button>

            <Title>Crypto</Title>
            <Button icon="toilet" mode="contained" loading={true}>Button</Button>
            <View>
                <Switch value={isSwitchOn} onValueChange={() => setIsSwitchOn(!isSwitchOn)} />
            </View>

            {/* SNACKBAR */}
            <Button mode={visibleSnack ? 'contained' : 'outlined'} onPress={() => setVisibleSnack(!visibleSnack)}>{visibleSnack ? 'Hide snack' : 'Show snack'}</Button>

            <Snackbar visible={visibleSnack}
                onDismiss={() => setVisibleSnack(false)}
                action={{
                    label: 'Undo',
                    onPress: () => {
                        // Do something
                    },
                }}> Hey there! I'm a Snackbar.
            </Snackbar>
        </View>

    )
}