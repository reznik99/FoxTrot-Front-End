import React, { Component } from 'react';
import { Text, View, TextInput, TouchableOpacity, AsyncStorage, ActivityIndicator } from 'react-native';

import axios from 'axios';
import qs from 'qs';
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
                const response = await axios.post('http://10.0.2.2:1234/login', qs.stringify({
                    username: username,
                    password: password
                })
                );

                // No error code thrown. Save JWT
                await AsyncStorage.setItem('JWT', response.data.token);

                this.setState({ loading: false });
                return this.props.navigation.navigate('Home');

            } catch (error) {
                this.setState({
                    message: error.response.data, loading: false
                });
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
                        {this.state.loading
                            ? <ActivityIndicator />
                            : <Text style={styles.buttonText}>Login</Text>
                        }
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

