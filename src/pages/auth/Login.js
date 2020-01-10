import React, { Component } from 'react';
import { Text, View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

import styles from './style'

export default class Login extends Component {
    constructor(props){
        super(props);

        this.state = {
            username: '',
            password: '',
            loading: false,
            message: ''
        }
    }

    login(){
        if(this.state.loading) return;

        //todo
        if(this.state.username === 'admin')
            if(this.state.password === 'admin')
                return this.props.navigation.navigate('Home');

        this.setState({message: "incorrect username and/or password"});
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
                    <TouchableOpacity style={styles.button} onPress={() => this.login()}>
                        <Text style={styles.buttonText}>Login</Text>
                    </TouchableOpacity>
                    <Text style={styles.subTitle}>Or</Text>
                    <TouchableOpacity style={[styles.button, styles.buttonCyan]}
                                      onPress={() => this.props.navigation.navigate('Signup')}>
                        <Text style={styles.buttonText}>Signup</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }
}

