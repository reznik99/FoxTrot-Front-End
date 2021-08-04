import React, { useState } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';

import { Button, Menu, Divider, Provider } from 'react-native-paper';

import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faBars, faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import styles from "./HeaderStyles";

export default function Header(props) {

    const [visible, setvisible] = useState(false)

    return (
        <View style={[styles.topBar, styles.padded]}>
            <View style={[styles.backAndTitle, styles.wider]}>
                {
                    props.allowBack ?
                        <TouchableOpacity style={styles.button} onPress={() => props.navigation.goBack(null)}>
                            <FontAwesomeIcon icon={faArrowLeft} size={22} style={styles.topBarText} />
                        </TouchableOpacity>
                        :
                        null
                }
                <Text style={styles.topBarText}>{props.pageTitle}</Text>
            </View>

            <Provider>
                <View style={[styles.buttonContainer, styles.rightFloat]}>
                    <Menu visible={visible}
                        onDismiss={() => setvisible(false)}
                        anchor={
                            <TouchableOpacity style={styles.button} onPress={() => setvisible(true)}>
                                <FontAwesomeIcon icon={faBars} size={20} style={styles.topBarText} />
                            </TouchableOpacity>
                        }>
                        <Menu.Item onPress={() => props.navigation.navigate('Login')} title="Logout" />
                        <Menu.Item onPress={() => props.navigation.navigate('Login')} title="Logout" />
                        <Divider />
                        <Menu.Item onPress={() => props.navigation.navigate('Login')} title="Logout" />
                    </Menu>
                </View>
            </Provider>
        </View>
    );
}
