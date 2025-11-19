import React, { Component } from 'react';
import { ConnectedProps, connect } from 'react-redux';
import { View, ScrollView, Keyboard, Alert } from 'react-native';
import { ActivityIndicator, TextInput, Button, Text, IconButton } from 'react-native-paper';
import * as Keychain from 'react-native-keychain';
import SplashScreen from 'react-native-splash-screen';

import styles from './style';
import { API_URL, DARKHEADER, KeychainOpts, PRIMARY } from '~/global/variables';
import { validateToken, syncFromStorage } from '~/store/actions/user';
import { logIn } from '~/store/actions/auth';
import { RootState, store } from '~/store/store';
import { AuthStackParamList } from '../../../App';
import { StackScreenProps } from '@react-navigation/stack';

type Credentials = {
    username: string;
    password: string;
    auth_token: string;
    time: number;
}

interface IState {
    gloablLoading: boolean;
    username: string;
    password: string;
}

type IProps = StackScreenProps<AuthStackParamList, 'Login'> & PropsFromRedux

class Login extends Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);
        this.state = {
            gloablLoading: false,
            username: '',
            password: '',
        };
    }

    async componentDidMount() {
        SplashScreen.hide();

        // Auto-fill username field from signup page
        if (!this.state.username && this.props.user_data?.phone_no) {
            this.setState({ username: this.props.user_data?.phone_no });
        }

        // If user manually logged out, don't try autologin
        if (this.props.route.params?.data?.loggedOut) {
            if (this.props.route.params?.data?.errorMsg) {
                Alert.alert('Unable to Login',
                    this.props.route.params?.data?.errorMsg,
                    [{ text: 'OK', onPress: () => { } }]
                );
            }
            return console.debug('User logged out');
        }

        try {
            this.setState({ gloablLoading: true });

            // Load data from disk into redux store
            if (!this.props.user_data?.phone_no && !this.state.username) {
                await store.dispatch(syncFromStorage());
                this.setState({ username: this.props.user_data?.phone_no || '' }, () => this.attemptAutoLogin());
            }
        } catch (err) {
            console.error('Error on auto-login:', err);
        } finally {
            this.setState({ gloablLoading: false });
        }
    }

    attemptAutoLogin = async () => {
        const creds = await this.loadCredentials(this.state.username);
        if (!creds) { return; }

        // If auth token is recent (<30min) then validate it
        if (Date.now() - creds.time < 1000 * 60 * 30) {
            // TODO: place token in store in store
            if (await this.props.validateToken({ token: creds.auth_token })) {
                console.debug('JWT auth token still valid, skipping login...');
                this.props.navigation.replace('App');
                return true;
            }
        }
        // Auth token expired, use password
        await this.handleLogin(this.state.username, creds.password);

        return true;
    };

    loadCredentials = async (username: string) => {
        try {
            console.debug('Loading credentials from secure storage');
            const res = await Keychain.getGenericPassword({
                server: API_URL,
                service: `${username}-credentials`,
                accessControl: KeychainOpts.accessControl,
                authenticationPrompt: KeychainOpts.authenticationPrompt,
            });
            if (!res) { return undefined; }
            if (res.username !== this.state.username) { return undefined; }

            const creds = JSON.parse(res.password);
            return { username: res.username, ...creds } as Credentials;
        } catch (err) {
            console.error('Failed to load creds:', err);
            return undefined;
        }
    };

    handleLogin = async (username: string, password: string) => {
        if (this.props.loading) { return; }

        Keyboard.dismiss();
        const loggedIn = await this.props.logIn({ username, password });
        if (loggedIn) {
            console.debug('Routing to home page');
            this.props.navigation.replace('App');
        }
    };

    render() {
        return (
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.wrapper}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>FoxTrot</Text>
                        <Text style={styles.subTitle}>secure communications</Text>
                    </View>
                    {this.props.loginErr && <Text style={styles.errorMsg}>{this.props.loginErr}</Text>}

                    {this.state.gloablLoading
                        ? <ActivityIndicator size="large" />
                        : <View>
                            <TextInput mode="outlined"
                                autoCapitalize="none"
                                onChangeText={val => this.setState({ username: val.trim() })}
                                value={this.state.username}
                                label="Username"
                                outlineColor={this.props.loginErr ? 'red' : undefined}
                            />
                            <TextInput mode="outlined"
                                autoCapitalize="none"
                                onChangeText={val => this.setState({ password: val.trim() })}
                                value={this.state.password}
                                label="Password"
                                secureTextEntry={true}
                                outlineColor={this.props.loginErr ? 'red' : undefined}
                            />

                            {/* Actions */}
                            <View style={{ marginTop: 30, display: 'flex', alignItems: 'center' }}>
                                <Button mode="contained"
                                    icon="login"
                                    style={styles.button}
                                    loading={this.props.loading}
                                    onPress={() => this.handleLogin(this.state.username, this.state.password)}>Login</Button>
                                <Text style={{ paddingVertical: 10 }}>Or</Text>
                                <Button mode="contained"
                                    icon="account-plus"
                                    style={[styles.button, { backgroundColor: DARKHEADER }]}
                                    onPress={() => this.props.navigation.navigate('Signup')}>Signup</Button>
                            </View>
                            <View style={{ display: 'flex', alignItems: 'center' }}>
                                <IconButton icon="fingerprint"
                                    size={50}
                                    iconColor={PRIMARY}
                                    onPress={this.attemptAutoLogin}
                                    accessibilityLabel="Retry biometric authentication"
                                />
                            </View>
                        </View>
                    }
                </View>
            </ScrollView>
        );
    }
}

const mapStateToProps = (state: RootState) => ({
    user_data: state.userReducer.user_data,
    loading: state.userReducer.loading,
    loginErr: state.userReducer.loginErr,
});

const mapDispatchToProps = {
    syncFromStorage,
    validateToken,
    logIn,
};

const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>
export default connector(Login);
