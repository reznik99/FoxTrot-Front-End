import React, { Component } from 'react';
import { Text, View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

import styles from './style'

export default class Login extends Component {
    constructor(props){
        super(props);

        this.state = {
            username: '',
            password: '',
            re_password: '',
            loading: false,
            message: ''
        }
    }

    render() {
        return (
            <View style={styles.wrapper}>
                <View style={styles.logoView}>
                    <Text style={styles.title}>FoxTrot</Text>
                    <Text style={styles.subTitle}>secure communications</Text>
                </View>
                <View style={styles.container}>
                    { this.state.message ? <Text style={styles.errorMsg}>{this.state.message}</Text> : null}
                    <TextInput placeholder="Enter User name"
                               onChangeText={ TextInputValue =>
                                   this.setState({username : TextInputValue }) }
                               underlineColorAndroid='transparent'
                               style={styles.input}
                    />
                    <TextInput placeholder="Enter password"
                               onChangeText={ TextInputValue =>
                                   this.setState({password: TextInputValue }) }
                               underlineColorAndroid='transparent'
                               secureTextEntry={true}
                               style={styles.input}
                    />
                    <TextInput placeholder="Repeat password"
                               onChangeText={ TextInputValue =>
                                   this.setState({re_password: TextInputValue }) }
                               underlineColorAndroid='transparent'
                               secureTextEntry={true}
                               style={styles.input}
                    />
                    <TouchableOpacity style={[styles.button, styles.buttonCyan]}>
                        <Text style={styles.buttonText}>Signup</Text>
                    </TouchableOpacity>
                    <Text style={styles.subTitle}>Or</Text>
                    <TouchableOpacity style={styles.button}
                                      onPress={() => this.props.navigation.navigate('Login')}>
                        <Text style={styles.buttonText}>Login</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }
}

