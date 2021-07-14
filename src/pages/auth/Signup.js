import React, { Component } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { Button, Input, Text } from 'galio-framework';
import axios from 'axios'
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
            // Send data to server
            axios.post('http://francescogorini.com:1234/signup', {
                phone_no: phone_no,
                password: password
            }).then((response) => {
                // No error code thrown. Signup successful
                return this.props.navigation.navigate('Login');
            }).catch(err => {
                this.showError(err.response?.data);
            }).finally(() => {
                this.setState({ loading: false });
            })
        }
    }

    render() {
        return (
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.wrapper}>
                    <View style={styles.logoView}>
                        <Text style={styles.title} h4>FoxTrot</Text>
                        <Text style={styles.title} h6 muted>secure communications</Text>
                    </View>
                    {this.state.message ? <Text style={styles.errorMsg}>{this.state.message}</Text> : null}
                    <Input onChangeText={val => this.setState({ phone_no: val })}
                        underlineColorAndroid='transparent'
                        help="Phone number"
                        placeholder="+64 000 00 000"
                        placeholderTextColor="#333"
                    />
                    <Input onChangeText={val => this.setState({ password: val })}
                        underlineColorAndroid='transparent'
                        secureTextEntry={true}
                        help="Password"
                        placeholder="********"
                        placeholderTextColor="#333"
                    />
                    <Input onChangeText={val => this.setState({ re_password: val })}
                        underlineColorAndroid='transparent'
                        secureTextEntry={true}
                        help="Repeat Password"
                        placeholder="********"
                        placeholderTextColor="#333"
                    />
                    {this.state.loading
                        ? <Button style={[styles.button, styles.buttonCyan]}><ActivityIndicator color="#00FFFF" /></Button>
                        : <Button style={[styles.button, styles.buttonCyan]} onPress={() => this.signup()}>Signup</Button>
                    }

                    <Text>Or</Text>
                    <Button style={styles.button} onPress={() => this.props.navigation.navigate('Login')}> Login </Button>
                </View>
            </ScrollView>
        );
    }
}

