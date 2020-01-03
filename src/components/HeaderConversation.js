import React, { Component } from 'react';
import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';

import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {faVideo, faPhoneAlt, faBars, faArrowLeft} from '@fortawesome/free-solid-svg-icons'
import styles from "./HeaderStyles";

class HeaderConversation extends Component {
    constructor(props){
        super(props);
    }

    render() {
        const { navigation } = this.props;
        return (
            <View style={styles.topBar}>
                <View style={styles.backAndTitle}>
                    {
                        this.props.allowBack ?
                            <TouchableOpacity style={styles.button} onPress={() => navigation.goBack(null)}>
                                <FontAwesomeIcon icon={ faArrowLeft } size={22} style={styles.topBarText}/>
                            </TouchableOpacity>
                            :
                            null
                    }
                    <Text style={styles.topBarText}>{navigation.state.params.data.from}</Text>
                </View>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.button}>
                        <FontAwesomeIcon icon={ faVideo } size={20} style={styles.topBarText}/>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button}>
                        <FontAwesomeIcon icon={ faPhoneAlt } size={20} style={styles.topBarText}/>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button}>
                        <FontAwesomeIcon icon={ faBars } size={20} style={styles.topBarText}/>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }
}

export default HeaderConversation;
