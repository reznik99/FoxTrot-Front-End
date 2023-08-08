import React, { useState, useCallback } from 'react'
import { View, TouchableOpacity, ToastAndroid } from 'react-native'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faVideo, faPhone, faBars, faArrowLeft, faLock } from '@fortawesome/free-solid-svg-icons'
import { ActivityIndicator, Text, Button, Dialog, Paragraph, Portal } from 'react-native-paper'
import { Image } from "react-native-elements"
import Clipboard from '@react-native-clipboard/clipboard'

import styles from "./HeaderStyles"
import { useSelector } from 'react-redux'
import { publicKeyFingerprint } from '~/global/crypto'

export default function HeaderConversation(props) {

    const { navigation, allowBack, data } = props;
    const [visibleDialog, setVisibleDialog] = useState('')
    const [securityCode, setSecurityCode] = useState('')
    const contacts = useSelector((store) => store.userReducer.contacts)

    const showSecurityCode = useCallback(async () => {
        const contact = contacts.find(contact => contact.phone_no === data.peer_user.phone_no)
        if (!contact) return
        setVisibleDialog('SecurityCode')
        const digest = await publicKeyFingerprint(contact.public_key)
        setSecurityCode(digest)
    })

    const copySecurityCode = useCallback(() => {
        setVisibleDialog('')
        Clipboard.setString(securityCode)
        ToastAndroid.show(
            'Security Code Copied',
            ToastAndroid.SHORT
        );
    })

    return (
        <View style={styles.topBar}>
            <View style={styles.backAndTitle}>
                {
                    allowBack ?
                        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Home')}>
                            <FontAwesomeIcon icon={faArrowLeft} size={20} style={styles.topBarText} />
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
                    <FontAwesomeIcon icon={faVideo} size={20} style={styles.topBarText} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Call', { data: { peer_user: data?.peer_user } })}>
                    <FontAwesomeIcon icon={faPhone} size={20} style={styles.topBarText} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.button}>
                    <FontAwesomeIcon icon={faBars} size={20} style={styles.topBarText} />
                </TouchableOpacity>
            </View>

            <Portal>
                <Dialog visible={visibleDialog === 'SecurityCode'} onDismiss={() => setVisibleDialog('')}>
                    <Dialog.Title>
                        <FontAwesomeIcon icon={faLock} color="#00ff00" /> Security Code
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
