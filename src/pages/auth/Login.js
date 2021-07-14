import React, { Component } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Keyboard } from 'react-native';
import { Button, Input, Text } from 'galio-framework';
import axios from 'axios'
import styles from './style'
import userData from './../../store/userData';

export default class Login extends Component {
    constructor(props) {
        super(props);

        this.state = {
            phone_no: '',
            password: '',
            loading: false,
            message: ''
        }
    }

    async componentDidMount() {
        if (await userData.isAuthenticated()) {
            return this.props.navigation.navigate('Home');
        }
        console.log("user not authenticated")
    }

    showError = (msg) => {
        this.setState({
            message: msg, loading: false
        });
    }

    login = async () => {
        const { phone_no, password, loading } = this.state;

        if (loading) return;
        if (phone_no === '' || password === '') {
            this.showError('Textfields cannot be blank!');
            return;
        }

        this.setState({ loading: true });
        Keyboard.dismiss()

        axios.post('http://francescogorini.com:1234/login', {
            phone_no: phone_no,
            password: password
        }).then(async (response) => {
            // No error code thrown. Save JWT
            await userData.setJWToken(response.data.token, phone_no)
            return this.props.navigation.navigate('Home');
        }).catch(err => {
            this.showError(err.response?.data);
        }).finally(() => {
            this.setState({ loading: false });
        })
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
                    <Input
                        value={this.state.phone_no}
                        onChangeText={val => this.setState({ phone_no: val })}
                        style={{ borderColor: "red" }}
                        help="Phone number"
                        placeholder="Phone no."
                        placeholderTextColor="#333"
                    />
                    <Input value={this.state.password}
                        onChangeText={val => this.setState({ password: val })}
                        secureTextEntry={true}
                        help="Password"
                        placeholder="Password"
                        placeholderTextColor="#333"
                    />
                    {this.state.loading
                        ? <Button style={styles.button}><ActivityIndicator color="#00FFFF" /></Button>
                        : <Button style={styles.button} onPress={() => this.login()}>Login</Button>
                    }

                    <Text>Or</Text>
                    <Button style={[styles.button, styles.buttonCyan]} onPress={() => this.props.navigation.navigate('Signup')}>Signup </Button>
                </View>
            </ScrollView>
        );
    }
}

