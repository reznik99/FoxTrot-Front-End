import React from 'react'
import { Text, View, TouchableOpacity } from 'react-native'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faVideo, faPhone, faBars, faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { Image } from "react-native-elements"
import { ActivityIndicator } from 'react-native-paper'

import styles from "./HeaderStyles"

export default function HeaderConversation(props) {

    const { navigation } = props;

    return (
        <View style={styles.topBar}>
            <View style={styles.backAndTitle}>
                {
                    props.allowBack ?
                        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Home')}>
                            <FontAwesomeIcon icon={faArrowLeft} size={20} style={styles.topBarText} />
                        </TouchableOpacity>
                        :
                        null
                }
                <TouchableOpacity style={styles.profileBtn}>
                    <View style={styles.profilePicContainer}>
                        <Image source={{ uri: props.data?.peer_user?.pic }}
                            style={styles.profilePic}
                            PlaceholderContent={<ActivityIndicator />} />
                    </View>
                    <Text style={styles.topBarText}>{props.data?.peer_user?.phone_no}</Text>
                </TouchableOpacity>
            </View>
            <View style={[styles.buttonContainer]}>
                <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Call', { data: {peer_user: props.data?.peer_user} })}>
                    <FontAwesomeIcon icon={faVideo} size={20} style={styles.topBarText} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Call', { data: {peer_user: props.data?.peer_user} })}>
                    <FontAwesomeIcon icon={faPhone} size={20} style={styles.topBarText} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.button}>
                    <FontAwesomeIcon icon={faBars} size={20} style={styles.topBarText} />
                </TouchableOpacity>
            </View>
        </View>
    )
}
