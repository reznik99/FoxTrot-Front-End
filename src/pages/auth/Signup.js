import React, { Component } from 'react';
import { Text, View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';

import axios from 'axios';
import qs from 'qs';
import styles from './style'

export default class Login extends Component {
    constructor(props) {
        super(props);

        this.state = {
            phone_no: '',
            password: '',
            re_password: '',
            loading: false,
            message: ''
        }
    }

    showError = (msg) => {
        this.setState({
            message: msg, loading: false
        });
    }

    signup = async () => {
        if (this.state.loading) return;

        const { phone_no, password, re_password } = this.state;
        this.setState({ loading: true });

        if (phone_no === '' || password === '' || re_password === '') {
            this.showError('Textfields cannot be blank!');
        } else if (password !== re_password) {
            this.showError('Passwords do not match!');
        } else {
            try {
                // Send data to server
                const response = await axios.post('http://10.0.2.2:1234/signup', qs.stringify({
                    phone_no: phone_no,
                    password: password
                }), {
                    headers: { "Content-Type": "application/x-www-form-urlencoded" }
                }
                );

                // No error code thrown. Signup successful

                this.setState({ loading: false });
                return this.props.navigation.navigate('Login');

            } catch (error) {
                this.showError(error.response.data);
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
                    <TextInput placeholder="Enter Phone number"
                        onChangeText={TextInputValue =>
                            this.setState({ phone_no: TextInputValue })}
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
                    <TextInput placeholder="Repeat password"
                        onChangeText={TextInputValue =>
                            this.setState({ re_password: TextInputValue })}
                        underlineColorAndroid='transparent'
                        secureTextEntry={true}
                        style={styles.input}
                    />
                    <TouchableOpacity style={[styles.button, styles.buttonCyan]} onPress={() => this.signup()}>
                        {this.state.loading
                            ? <ActivityIndicator />
                            : <Text style={styles.buttonText}>Signup</Text>
                        }
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

