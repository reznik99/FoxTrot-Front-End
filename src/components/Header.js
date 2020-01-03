import React, { Component } from 'react';
import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';

import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faBars, faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import styles from "./HeaderStyles";

class Header extends Component {
    constructor(props){
        super(props);
    }
    render() {
        return (
            <View style={[styles.topBar, styles.padded]}>
                <View style={[styles.backAndTitle, styles.wider]}>
                    {
                        this.props.allowBack ?
                            <TouchableOpacity style={styles.button} onPress={() => this.props.navigation.goBack(null)}>
                                <FontAwesomeIcon icon={ faArrowLeft } size={22} style={styles.topBarText}/>
                            </TouchableOpacity>
                            :
                            null
                    }
                    <Text style={styles.topBarText}>{this.props.pageTitle}</Text>
                </View>
                <View style={[styles.buttonContainer, styles.rightFloat]}>
                    <TouchableOpacity style={styles.button} onPress={() => this.props.navigation.navigate('Login')}>
                        <FontAwesomeIcon icon={ faBars } size={20} style={styles.topBarText}/>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }
}

export default Header;
