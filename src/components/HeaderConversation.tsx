import React, { useState, useCallback } from 'react'
import { View, TouchableOpacity, ToastAndroid, Platform, StyleSheet } from 'react-native'
import { useSelector } from 'react-redux'
import { Image } from "react-native-elements"
import { ActivityIndicator, Text, Button, Dialog, Paragraph, Portal, Icon } from 'react-native-paper'
import Clipboard from '@react-native-clipboard/clipboard'

import { publicKeyFingerprint } from '~/global/crypto'
import { RootState } from '~/store/store'
import { UserData } from '~/store/reducers/user'
import { DARKHEADER } from '~/global/variables'

interface IProps {
    navigation: any;
    data: {
        peer_user: UserData;
    };
    allowBack: boolean;
}

export default function HeaderConversation(props: IProps) {

    const { navigation, allowBack, data } = props;
    const [visibleDialog, setVisibleDialog] = useState('')
    const [securityCode, setSecurityCode] = useState('')
    const contacts = useSelector((store: RootState) => store.userReducer.contacts)

    const showSecurityCode = useCallback(async () => {
        const contact = contacts.find(contact => contact.phone_no === data.peer_user.phone_no)
        if (!contact || !contact.public_key) return

        setVisibleDialog('SecurityCode')
        const digest = await publicKeyFingerprint(contact.public_key)
        setSecurityCode(digest)
    }, [contacts])

    const copySecurityCode = useCallback(() => {
        setVisibleDialog('')
        Clipboard.setString(securityCode)
        ToastAndroid.show(
            'Security Code Copied',
            ToastAndroid.SHORT
        );
    }, [securityCode])

    return (
        <View style={styles.topBar}>
            <View style={styles.backAndTitle}>
                {
                    allowBack ?
                        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Home')}>
                            <Icon source="arrow-left" color={styles.topBarText.color} size={styles.topBarText.fontSize}/>
                        </TouchableOpacity>
                        :
                        null
                }
                <TouchableOpacity style={styles.profileBtn} onPress={showSecurityCode}>
                    <View style={styles.profilePicContainer}>
                        <Image source={{ uri: `${data?.peer_user?.pic}` }}
                            style={styles.profilePic}
                            PlaceholderContent={<ActivityIndicator />} />
                    </View>
                    <Text style={styles.topBarText}>{data?.peer_user?.phone_no}</Text>
                </TouchableOpacity>
            </View>
            <View style={[styles.buttonContainer]}>
                <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Call', { data: { peer_user: data?.peer_user } })}>
                    <Icon source="video" color={styles.topBarText.color} size={styles.topBarText.fontSize}/>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Call', { data: { peer_user: data?.peer_user } })}>
                    <Icon source="phone" color={styles.topBarText.color} size={styles.topBarText.fontSize}/>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button}>
                    <Icon source="menu" color={styles.topBarText.color} size={styles.topBarText.fontSize}/>
                </TouchableOpacity>
            </View>

            <Portal>
                <Dialog visible={visibleDialog === 'SecurityCode'} onDismiss={() => setVisibleDialog('')}>
                    <Dialog.Title>
                        <Icon source="lock" color={styles.topBarText.color} size={styles.topBarText.fontSize}/> Security Code
                    </Dialog.Title>
                    <Dialog.Content>
                        <Paragraph>Verify with your contact ({data?.peer_user?.phone_no}) that this code matches their profile code:</Paragraph>
                        {securityCode.match(/.{1,24}/g)?.map((val, idx) => (
                            <Paragraph key={idx} style={{ fontFamily: 'Roboto', textAlign: 'center' }}>{val}</Paragraph>
                        ))}
                    </Dialog.Content>
                    <Dialog.Actions style={{ justifyContent: 'space-evenly' }}>
                        <Button onPress={() => setVisibleDialog('')} mode='text' style={{ paddingHorizontal: 15 }}>Close</Button>
                        <Button onPress={() => copySecurityCode()} mode='contained' style={{ paddingHorizontal: 15 }}>Copy Code</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    )
}

const styles = StyleSheet.create({
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: DARKHEADER,
        paddingVertical: 5,
    }, backAndTitle: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        overflow: 'hidden'
    }, topBarText: {
        color: '#fff',
        fontSize: 15,
    }, buttonContainer: {
        flexDirection: "row",
        alignItems: "center",
    }, button: {
        height: 50,
        padding: 10,
        marginHorizontal: 5,
        justifyContent: 'center',
        alignItems: 'center'
    }, rightFloat: {
        justifyContent: "flex-end",
    }, padded: {
        paddingHorizontal: 15
    }, wider: {
        overflow: 'visible'
    }, profileBtn: {
        flexDirection: 'row',
        alignItems: 'center'
    }, profilePicContainer: {
        overflow: "hidden",
        borderRadius: Platform.OS === 'ios' ? 150 / 2 : 150,
        marginRight: 8
    }, profilePic: {
        width: 40,
        height: 40,
        borderRadius: Platform.OS === 'ios' ? 150 / 2 : 150,
    }
});