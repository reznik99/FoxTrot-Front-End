import React, { useState, useEffect, useCallback } from 'react'
import { View } from 'react-native'
import { Button, Switch, Title, Snackbar, Paragraph, Dialog, Portal } from 'react-native-paper'
import { useSelector } from 'react-redux'

import globalStyle from "../../global/globalStyle"

export default function Settings(props) {

    const state = useSelector(state => state.userReducer)

    const [isSwitchOn, setIsSwitchOn] = React.useState(false)
    const [visibleSnack, setVisibleSnack] = React.useState(false)
    const [visibleDialog, setVisibleDialog] = React.useState(false)


    return (
        <View style={{ paddingHorizontal: 50 }}>
            <Title>Themes</Title>
            <Button icon="camera">Theme Light</Button>
            <Button mode="outlined">Theme Dark</Button>
            <Button mode="contained">Theme Custom</Button>

            <Title>Crypto</Title>
            <Button icon="toilet" mode="contained" loading={true}>Theme Custom</Button>
            <Switch value={isSwitchOn} onValueChange={() => setIsSwitchOn(!isSwitchOn)} />

            {/* SNACKBAR */}
            <Button onPress={() => setVisibleSnack(!visibleSnack)}>{visibleSnack ? 'Hide' : 'Show'}</Button>
            <Snackbar visible={visibleSnack}
                onDismiss={() => setVisibleSnack(false)}
                action={{
                    label: 'Undo',
                    onPress: () => {
                        // Do something
                    },
                }}> Hey there! I'm a Snackbar.
            </Snackbar>

            {/* PORTAL */}
            <Button onPress={() => setVisibleDialog(true)}>Show Dialog</Button>
            <Portal>
                <Dialog visible={visibleDialog} onDismiss={() => setVisibleDialog(false)}>
                    <Dialog.Title>Alert</Dialog.Title>
                    <Dialog.Content>
                        <Paragraph>This is simple dialog</Paragraph>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setVisibleDialog(false)}>Done</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>

    )
}