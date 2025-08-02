import React, { Component } from 'react';
import { ConnectedProps, connect } from 'react-redux'
import { View, ScrollView, Keyboard, Alert } from 'react-native';
import { ActivityIndicator, TextInput, Button, Text } from 'react-native-paper';
import * as Keychain from 'react-native-keychain';
// import * as LocalAuthentication from 'expo-local-authentication';
import SplashScreen from 'react-native-splash-screen'

import styles from './style';
import { DARKHEADER, KeychainOpts } from '~/global/variables';
import { validateToken, syncFromStorage } from '~/store/actions/user';
import { logIn } from '~/store/actions/auth';
import { UserData } from '~/store/reducers/user';
import { RootState } from '~/store/store';

interface IState {
    gloablLoading: boolean;
    username: string;
    password: string;
}

interface IProps extends PropsFromRedux {
    navigation: any;
    route: {
        params: {
            data: {
                errorMsg: string;
                loggedOut: boolean;
            }
        }
    },
}

class Login extends Component<IProps, IState> {

    constructor(props: IProps) {
        super(props)
        this.state = {
            gloablLoading: false,
            username: '',
            password: '',
        }
    }

    async componentDidMount() {
        SplashScreen.hide()

        // Auto-fill username field
        if (!this.state.username && this.props.user_data?.phone_no) {
            this.setState({ username: this.props.user_data?.phone_no })
        }

        // If user manually logged out, don't try autologin
        if (this.props.route.params?.data?.loggedOut) {
            if (this.props.route.params?.data?.errorMsg) {
                Alert.alert("Unable to Login",
                    this.props.route.params?.data?.errorMsg,
                    [{ text: "OK", onPress: () => { } }]
                );
            }
            return console.debug("User logged out")
        }

        try {
            this.setState({ gloablLoading: true })

            // Load data from disk into redux store
            if (!this.props.user_data?.phone_no) {
                await this.props.syncFromStorage()
                this.setState({ username: this.props.user_data?.phone_no || '' })
            }

            if (!this.state.username && !this.props.token) {
                console.debug("No data for auto-login");
                return
            }

            // Auto-login with JWT Token if still valid
            const auth = await this.attemptAutoLoginToken();
            if (auth.biometric && auth.success) return

            // Auto-login with user password if it was previously saved to secure storage
            await this.attemptAutoLogin(auth.biometric);

        } catch (err) {
            console.error('Error on auto-login:', err)
        } finally {
            this.setState({ gloablLoading: false })
        }
    }

    attemptAutoLoginToken = async () => {
        if (!this.props.token) {
            console.debug('Token not present')
            return { success: false, biometric: false }
        }

        // Saved JWT token is present. Auth user before login
        const biometricSuccess = await this.biometricAuth()
        if (!biometricSuccess) return { success: false, biometric: biometricSuccess }

        let loggedIn = await this.props.validateToken()
        if (!loggedIn) {
            console.debug('Token expired')
            return { success: false, biometric: biometricSuccess }
        }

        this.props.navigation.replace('App', { screen: 'Home' })
        return { success: true, biometric: biometricSuccess }
    }

    attemptAutoLogin = async (biometricSuccess: boolean) => {
        const serviceKey = `${this.state.username}-password`
        const passwordsSaved = await Keychain.getAllGenericPasswordServices()

        if (!this.state.username || !passwordsSaved.includes(serviceKey)) {
            console.debug('No credentials found for password auto-login')
            return false
        }

        // Saved password is present. Auth user before retrieving
        if (!biometricSuccess) {
            const biometricSuccess = await this.biometricAuth()
            if (!biometricSuccess) return false
        }

        // User is auth'd. Load password from secure storage
        console.debug('Loading password from secure storage')
        const res = await Keychain.getGenericPassword({
            authenticationPrompt: KeychainOpts.authenticationPrompt,
            service: serviceKey,
        })
        if (!res || !res.password) {
            console.debug('Failed to load password form secure storage')
            return false
        }

        // We loaded password from Keychain. Now Auto-login
        await this.handleLogin(this.state.username, res.password);

        return true
    }

    biometricAuth = async () => {
        console.debug('TODO: Fake biometric auth')
        return false
        // console.debug('Attempting biometric auth')
        // const biometricAuth = await LocalAuthentication.authenticateAsync()
        // if (!biometricAuth.success) {
        //     console.error('Biometric auth failed:', biometricAuth.error)
        //     return false
        // }
        // return true
    }

    handleLogin = async (username: string, password: string) => {
        if (this.props.loading) return

        Keyboard.dismiss()
        const loggedIn = await this.props.logIn(username, password)
        if (loggedIn) {
            console.debug("Routing to home page")
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
                    {this.props.loginErr && <Text style={styles.errorMsg}>{this.props.loginErr}</Text>}

                    {this.state.gloablLoading ? <ActivityIndicator size="large" />
                        : <View>
                            <TextInput mode="outlined"
                                onChangeText={val => this.setState({ username: val.trim() })}
                                value={this.state.username}
                                label="Username"
                                outlineColor={this.props.loginErr ? "red" : undefined}
                            />
                            <TextInput mode="outlined"
                                onChangeText={val => this.setState({ password: val.trim() })}
                                value={this.state.password}
                                label="Password"
                                secureTextEntry={true}
                                outlineColor={this.props.loginErr ? "red" : undefined}
                            />

                            {/* Actions */}
                            <View style={{ marginTop: 30, display: 'flex', alignItems: 'center' }}>
                                <Button mode="contained" icon="login" style={styles.button} loading={this.props.loading}
                                    onPress={() => this.handleLogin(this.state.username, this.state.password)}>Login</Button>
                                <Text style={{ paddingVertical: 10 }}>Or</Text>
                                <Button mode="contained" icon="account-plus" style={[styles.button, { backgroundColor: DARKHEADER }]}
                                    onPress={() => this.props.navigation.navigate('Signup')}>Signup</Button>
                            </View>
                        </View>
                    }
                </View>
            </ScrollView>
        )
    }
}

const mapStateToProps = (state: RootState) => ({
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

const connector = connect(mapStateToProps, mapDispatchToProps)
type PropsFromRedux = ConnectedProps<typeof connector>
export default connector(Login)