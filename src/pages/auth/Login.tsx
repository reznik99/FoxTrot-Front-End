import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { View, ScrollView, Keyboard, Alert } from 'react-native';
import { ActivityIndicator, TextInput, Button, Text, IconButton } from 'react-native-paper';
import * as Keychain from 'react-native-keychain';
import SplashScreen from 'react-native-splash-screen';
import { StackScreenProps } from '@react-navigation/stack';

import { validateToken, syncFromStorage } from '~/store/actions/user';
import { API_URL, KeychainOpts, PRIMARY } from '~/global/variables';
import { milliseconds, millisecondsSince } from '~/global/helper';
import { RootState, store } from '~/store/store';
import { AuthStackParamList } from '~/../App';
import { logIn } from '~/store/actions/auth';
import styles from './style';

type Credentials = {
    username: string;
    password: string;
    auth_token: string;
    time: number;
}

export default function Login(props: StackScreenProps<AuthStackParamList, 'Login'>) {
    const user_data = useSelector((state: RootState) => state.userReducer.user_data);
    const loading = useSelector((state: RootState) => state.userReducer.loading);
    const loginErr = useSelector((state: RootState) => state.userReducer.loginErr);

    const [gloablLoading, setGloablLoading] = useState(false)
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')

    useEffect(() => {
        // Hide app splashscreen
        SplashScreen.hide();
        // Auto-fill username field from signup page
        if (user_data?.phone_no) {
            setUsername(user_data?.phone_no)
        }
        // If user manually logged out, don't try autologin
        if (props.route.params?.data?.loggedOut) {
            if (props.route.params?.data?.errorMsg) {
                Alert.alert('Unable to Login',
                    props.route.params?.data?.errorMsg,
                    [{ text: 'OK', onPress: () => { } }]
                );
            }
            return console.debug('User logged out');
        }
        // Read user info from storage
        readStorage()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleLogin = useCallback(async () => {
        if (loading) { return; }

        Keyboard.dismiss();
        const loggedIn = await store.dispatch(logIn({ username, password })).unwrap();
        if (loggedIn) {
            console.debug('Routing to home page');
            props.navigation.replace('App');
        }
    }, [username, password, loading, props.navigation])

    const loadCredentials = useCallback(async () => {
        try {
            console.debug('Loading credentials from secure storage');
            const res = await Keychain.getGenericPassword({
                server: API_URL,
                service: `${username}-credentials`,
                accessControl: KeychainOpts.accessControl,
                authenticationPrompt: KeychainOpts.authenticationPrompt,
            });
            if (!res || res.username !== username) { return undefined; }

            const creds = JSON.parse(res.password);
            return { username: res.username, ...creds } as Credentials;
        } catch (err) {
            console.error('Failed to load creds:', err);
            return undefined;
        }
    }, [username])

    const attemptAutoLogin = useCallback(async () => {
        const creds = await loadCredentials();
        if (!creds) { return; }

        // If auth token is recent (<30min) then validate it
        if (millisecondsSince(new Date(creds.time)) < milliseconds.hour / 2) {
            // TODO: place token in store
            const tokenIsValid = await store.dispatch(validateToken(creds.auth_token)).unwrap()
            if (tokenIsValid) {
                console.debug('JWT auth token still valid, skipping login...');
                props.navigation.replace('App');
                return true;
            }
        }
        // Auth token expired, use password
        await handleLogin();

        return true;
    }, [handleLogin, loadCredentials, props.navigation])

    const readStorage = useCallback(async () => {
        try {
            setGloablLoading(true)
            // Load data from disk into redux store
            if (!user_data?.phone_no && !username) {
                await store.dispatch(syncFromStorage()).unwrap()
                setUsername(user_data.phone_no || '');
                await attemptAutoLogin()
            }
        } catch (err) {
            console.error('Error on auto-login:', err);
        } finally {
            setGloablLoading(false)
        }
    }, [user_data, username, attemptAutoLogin])

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.wrapper}>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>FoxTrot</Text>
                    <Text style={styles.subTitle}>secure communications</Text>
                </View>
                {loginErr && <Text style={styles.errorMsg}>{loginErr}</Text>}

                {gloablLoading
                    ? <ActivityIndicator size="large" />
                    : <View>
                        <TextInput mode="outlined"
                            autoCapitalize="none"
                            onChangeText={val => setUsername(val.trim())}
                            value={username}
                            label="Username"
                            outlineColor={loginErr ? 'red' : undefined}
                        />
                        <TextInput mode="outlined"
                            autoCapitalize="none"
                            onChangeText={val => setPassword(val.trim())}
                            value={password}
                            label="Password"
                            secureTextEntry={true}
                            outlineColor={loginErr ? 'red' : undefined}
                        />

                        {/* Actions */}
                        <View style={{ marginTop: 30, display: 'flex', alignItems: 'center' }}>
                            <Button mode="contained"
                                icon="login"
                                style={styles.button}
                                loading={loading}
                                onPress={handleLogin}>Login</Button>
                            <Text style={{ paddingVertical: 10 }}>Or</Text>
                            <Button mode="contained"
                                icon="account-plus"
                                style={styles.buttonSecondary}
                                onPress={() => props.navigation.navigate('Signup')}>Signup</Button>
                        </View>
                        <View style={{ display: 'flex', alignItems: 'center' }}>
                            <IconButton icon="fingerprint"
                                size={50}
                                iconColor={PRIMARY}
                                onPress={attemptAutoLogin}
                                accessibilityLabel="Retry biometric authentication"
                            />
                        </View>
                    </View>
                }
            </View>
        </ScrollView>
    );
}

