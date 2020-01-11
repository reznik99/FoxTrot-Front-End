import React, { Component } from 'react';
import { Text, View, TextInput, TouchableOpacity, AsyncStorage } from 'react-native';

import axios from 'axios';
import styles from './style';

export default class Login extends Component {
    constructor(props) {
        super(props);

        this.state = {
            username: '',
            password: '',
            loading: false,
            message: ''
        }
    }

    login = async () => {
        if (this.state.loading) return;

        this.setState({ loading: true });
        const { username, password } = this.state;

        if (username === '' || password === '') {
            this.setState({
                message: 'Textfields cannot be blank!', loading: false
            });
        } else {
            try {
                // Send data to server
                const response = await axios.post('http://localhost:1234/login', {
                    username,
                    password,
                });
                // if response is accpeted, store JWT 
                await AsyncStorage.setItem('JWT', response.data.token);
                
                this.setState({ loading: false });
                return this.props.navigation.navigate('Home');

            } catch (error) {
                console.error(error.response.data);
                if (error.response.data === 'bad username'
                    || error.response.data === 'passwords do not match') {
                    this.setState({
                        message: error.response.data, loading: false
                    });
                } else {
                    this.setState({
                        message: error, loading: false
                    });
                }
            }
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
                    {this.state.message ? <Text style={styles.errorMsg}>{this.state.message}</Text> : null}
                    <TextInput placeholder="Enter User name"
                        onChangeText={TextInputValue =>
                            this.setState({ username: TextInputValue })}
                        underlineColorAndroid='transparent'
                        style={styles.input}
                    />
                    <TextInput placeholder="Enter password"
                        onChangeText={TextInputValue =>
                            this.setState({ password: TextInputValue })}
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

