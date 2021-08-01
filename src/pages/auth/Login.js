import React, { useState, useEffect } from 'react';
import { View, ScrollView, ActivityIndicator, Keyboard } from 'react-native';
import { Button, Input, Text } from 'galio-framework';
import { useSelector, useDispatch } from 'react-redux';

import styles from './style'
import { validateToken, syncFromStorage } from '../../store/actions/user'
import { logIn } from '../../store/actions/auth'

export default function Login(props) {

    const { errorMsg, loading, phone_no } = useSelector(state => state.userReducer);
    const [gloablLoading, setGloablLoading] = useState(false)
    const [phone_number, setPhone_number] = useState('')
    const [password, setPassword] = useState('')

    const dispatch = useDispatch()

    useEffect(async () => {
        try {
            setGloablLoading(true)

            // Load data from disk into redux store
            await dispatch(syncFromStorage())

            // Auto-login if Token still valid
            let loggedIn = await dispatch(validateToken())
            if (loggedIn)
                return props.navigation.navigate('Home')

            // Auto-fill phone_no from storage
            setPhone_no(phone_no)
            console.log("Token expired")
        } finally {
            setGloablLoading(false)
        }
    }, []);


    login_better = async () => {
        if (loading) return;

        Keyboard.dismiss()

        let loggedIn = await dispatch(logIn(phone_number, password))
        if (loggedIn) {
            props.navigation.navigate('Home')
        }
    }


    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.wrapper}>
                <View>
                    <Text style={styles.title} h4>FoxTrot</Text>
                    <Text style={styles.title} h6 muted>secure communications</Text>
                </View>
                {errorMsg ? <Text style={styles.errorMsg}>{errorMsg}</Text> : null}

                {gloablLoading
                    ? <ActivityIndicator color="#00FFFF" size="large" />
                    : <>
                        <Input onChangeText={val => setPhone_number(val)}
                            value={phone_number}
                            style={errorMsg ? { borderColor: "red" } : null}
                            help="Phone number"
                            placeholder="Phone no."
                            placeholderTextColor="#333"
                        />
                        <Input onChangeText={val => setPassword(val)}
                            value={password}
                            style={errorMsg ? { borderColor: "red" } : null}
                            secureTextEntry={true}
                            help="Password"
                            placeholder="Password"
                            placeholderTextColor="#333"
                        />
                        {
                            loading
                                ? <Button style={styles.button}><ActivityIndicator color="#00FFFF" /></Button>
                                : <Button style={styles.button} onPress={() => login_better()}>Login</Button>
                        }
                        <Text>Or</Text>
                        <Button style={[styles.button, styles.buttonCyan]} onPress={() => props.navigation.navigate('Signup')}>Signup </Button>
                    </>
                }
            </View>
        </ScrollView>
    )
}

