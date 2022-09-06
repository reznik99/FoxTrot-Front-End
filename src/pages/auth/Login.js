import React, { Component } from 'react';
import { connect } from 'react-redux'
import { View, ScrollView, Keyboard } from 'react-native';
import { ActivityIndicator, TextInput, Button, Text } from 'react-native-paper';
import * as Keychain from 'react-native-keychain';
import * as LocalAuthentication from 'expo-local-authentication';

import styles from './style';
import {  KeychainOpts } from '~/global/variables';
import { validateToken, syncFromStorage } from '~/store/actions/user';
import { logIn } from '~/store/actions/auth';


class Login extends Component {

    constructor(props) {
        super(props)
        this.state = {
            gloablLoading: false,
            username: '',
            password: '',
        }
    }

    async componentDidMount() {
        // If user manually logged out, don't try autologin
        if (this.props.route.params?.data?.loggedOut) {
            return console.debug("User logged out")
        }

        try {
            this.setState({gloablLoading: true})

            // Load data from disk into redux store
            if(!this.props.user_data?.phone_no) {
                await this.props.syncFromStorage()
                this.setState({username: this.props.user_data?.phone_no || ''})
            }

            if(!this.state.username && !this.props.token) {
                console.debug("No data for auto-login");
                return
            }

            // Auto-login if Token still valid (temporary disabled)
            const success = await this.attemptAutoLoginToken();
            if (success) return

            // Check if user's password was saved to secure storage
            await this.attemptAutoLoginPassword();

        } catch(err){
            console.error('Error on auto-login: ', err)
        } finally {
            this.setState({gloablLoading: false})
        }
    }

    attemptAutoLoginToken = async () => {
        if (!this.props.token) {
            console.debug('Token not present')
            return false
        }
        
        let loggedIn = await this.props.validateToken()
        if (!loggedIn) {
            console.debug('Token expired')
            return false
        }

        this.props.navigation.replace('App', { screen: 'Home' })
        return true
    }

    attemptAutoLoginPassword = async () => {
        const serviceKey = `${this.props.user_data?.phone_no}-password`
        const passwordsSaved = await Keychain.getAllGenericPasswordServices()

        if(!this.state.username || !passwordsSaved.includes(serviceKey)) {
            console.debug('No credentials found for password auto-login')
            return false
        }

        // Saved password is present. Auth user before retrieving
        console.debug('Attempting biometric auth')
        const biometricAuth = await LocalAuthentication.authenticateAsync()
        if(!biometricAuth.success) {
            console.error('Biometric auth failed: ', biometricAuth.error)
            return false
        }

        // User is auth'd. Load password from secure storage
        console.debug('Loading password from secure storage')
        const res = await Keychain.getGenericPassword({
            authenticationPrompt: KeychainOpts.authenticationPrompt,
            service: serviceKey,
        })
        if(!res || !res.password) {
            console.debug('Failed to load password form secure storage')
            return false
        }

        // We loaded password from Keychain. Now Auto-login
        await this.handleLogin(this.state.username, res.password);

        return true
    }

    handleLogin = async (username, password) => {
        if (this.props.loading) return

        Keyboard.dismiss()
        let loggedIn = await this.props.logIn(username, password)
        if (loggedIn) {
            this.props.navigation.replace('App', { screen: 'Home' })
        }
    }


    render() {
        return (
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.wrapper}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>FoxTrot</Text>
                        <Text style={styles.subTitle}>secure communications</Text>
                    </View>
                    { this.props.loginErr && <Text style={styles.errorMsg}>{this.props.loginErr}</Text> }
    
                    { this.state.gloablLoading ? <ActivityIndicator size="large" />
                        : <View>
                            <TextInput mode="outlined" 
                                onChangeText={val => this.setState({username: val})}
                                value={this.state.username}
                                label="Phone no."
                                outlineColor={this.props.loginErr ? "red"  : null}
                            />
                            <TextInput mode="outlined" 
                                onChangeText={val => this.setState({password: val})}
                                value={this.state.password} 
                                label="Password"
                                secureTextEntry={true}
                                outlineColor={this.props.loginErr ? "red"  : null}
                            />
                            
                            {/* Actions */}
                            <View style={{marginTop: 30, display: 'flex', alignItems: 'center'}}>
                                <Button mode="contained" icon="login" style={styles.button} loading={this.props.loading} onPress={() => this.handleLogin(this.state.username, this.state.password)}>Login</Button>
                                <Text style={{paddingVertical: 10}}>Or</Text>
                                <Button icon="account-plus" style={[styles.button, {backgroundColor: 'none'}]} onPress={() => this.props.navigation.navigate('Signup')}>Signup</Button>
                            </View>
                        </View>
                    }
                </View>
            </ScrollView>
        )
    }
}

const mapStateToProps = (state, ownProps) => ({
    user_data: state.userReducer.user_data,
    token: state.userReducer.token,
    loading: state.userReducer.loading,
    loginErr: state.userReducer.loginErr,
})
  
const mapDispatchToProps = {
    syncFromStorage,
    validateToken,
    logIn
}


// We normally do both in one step, like this:
export default connect(mapStateToProps, mapDispatchToProps)(Login)