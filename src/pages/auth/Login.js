import React, { Component } from 'react';
import { connect } from 'react-redux'
import { View, ScrollView, Keyboard } from 'react-native';
import { ActivityIndicator, TextInput, Button, Text } from 'react-native-paper';
import * as Keychain from 'react-native-keychain';

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

            // Auto-login if Token still valid (temporary disabled)
            if(this.props.token && false) {
                let loggedIn = await this.props.validateToken()
                if (loggedIn) return this.props.navigation.replace('App', { screen: 'Home' })
            }

            // Auto-login if password stored in secure storage
            if(this.props.user_data?.phone_no && !this.props.loading) {
                console.debug('Loading password from secure storage')
                const res = await Keychain.getGenericPassword({
                    authenticationPrompt: KeychainOpts.authenticationPrompt,
                    service: `${this.props.user_data?.phone_no}-password`,
                })
                
                if(res) {
                    this.setState({password: res.password}, () => this.handleLogin())
                    return
                }
            }

            console.debug("Token missing or expired")
        } catch(err){
            console.error('Error on auto-login: ', err, await Keychain.getSupportedBiometryType())
        } finally {
            this.setState({gloablLoading: false})
        }
    }

    handleLogin = async () => {
        if (this.props.loading) return

        Keyboard.dismiss()
        let loggedIn = await this.props.logIn(this.state.username, this.state.password)
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
                                <Button mode="contained" icon="login" style={styles.button} loading={this.props.loading} onPress={this.handleLogin}>Login</Button>
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