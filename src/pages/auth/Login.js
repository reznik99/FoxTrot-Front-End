import React, { Component } from 'react';
import { Text, View, TextInput, TouchableOpacity, ActivityIndicator, Keyboard } from 'react-native';
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

    componentDidMount() {
        if (userData.isAuthenticated()) {
            return this.props.navigation.navigate('Home');
        }
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
            <View style={styles.wrapper}>
                <View style={styles.logoView}>
                    <Text style={styles.title}>FoxTrot</Text>
                    <Text style={styles.subTitle}>secure communications</Text>
                </View>
                <View style={styles.container}>
                    {this.state.message ? <Text style={styles.errorMsg}>{this.state.message}</Text> : null}
                    <TextInput placeholder="Phone no."
                        value={this.state.phone_no}
                        onChangeText={TextInputValue =>
                            this.setState({ phone_no: TextInputValue })}
                        underlineColorAndroid='transparent'
                        style={styles.input}
                    />
                    <TextInput placeholder="Password"
                        value={this.state.password}
                        onChangeText={TextInputValue =>
                            this.setState({ password: TextInputValue })}
                        underlineColorAndroid='transparent'
                        secureTextEntry={true}
                        style={styles.input}
                    />
                    {this.state.loading
                        ? <TouchableOpacity style={styles.button}><ActivityIndicator color="#00FFFF" /></TouchableOpacity>
                        : <TouchableOpacity style={styles.button} onPress={() => this.login()}><Text style={styles.buttonText}>Login</Text></TouchableOpacity>
                    }

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

