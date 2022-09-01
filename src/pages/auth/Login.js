import React, { useState, useCallback, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { View, ScrollView, Keyboard } from 'react-native'
import { ActivityIndicator, TextInput, Button, Text } from 'react-native-paper'

import styles from './style'
import { validateToken, syncFromStorage } from '~/store/actions/user'
import { logIn } from '~/store/actions/auth'

export default function Login(props) {

    const { loginErr, loading, user_data } = useSelector(state => state.userReducer);
    const [gloablLoading, setGloablLoading] = useState(false)
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')

    const dispatch = useDispatch()

    useEffect(() => {
        const autoLogin = async () => {
            try {
                setGloablLoading(true)
                // Load data from disk into redux store
                await dispatch(syncFromStorage())
                // If user manually logged out, don't try autologin
                if (props.route.params?.data?.loggedOut) {
                    return console.log("User logged out")
                }
                // Auto-login if Token still valid
                let loggedIn = await dispatch(validateToken())
                if (loggedIn)
                    return props.navigation.replace('App', { screen: 'Home' })
                console.log("Token expired")
            } finally {
                setGloablLoading(false)
            }
        }
        autoLogin()
    }, []);

    useEffect(() => {
        // Auto-fill phone_no from storage
        setUsername(user_data?.phone_no || '')
    }, [user_data])

    const handleLogin = useCallback(async () => {
        if (loading) return

        Keyboard.dismiss()
        let loggedIn = await dispatch(logIn(username, password))
        if (loggedIn) {
            props.navigation.replace('App', { screen: 'Home' })
        }
    }, [username, password, loading]);


    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.wrapper}>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>FoxTrot</Text>
                    <Text style={styles.subTitle}>secure communications</Text>
                </View>
                { loginErr && <Text style={styles.errorMsg}>{loginErr}</Text> }

                { gloablLoading ? <ActivityIndicator size="large" />
                    : <View>
                        <TextInput mode="outlined" 
                            onChangeText={val => setUsername(val)}
                            value={username}
                            label="Phone no."
                            outlineColor={loginErr ? "red"  : null}
                        />
                        <TextInput mode="outlined" 
                            onChangeText={val => setPassword(val)} 
                            value={password} 
                            label="Password"
                            secureTextEntry={true}
                            outlineColor={loginErr ? "red"  : null}
                        />
                        
                        {/* Actions */}
                        <View style={{marginTop: 30, display: 'flex', alignItems: 'center'}}>
                            <Button mode="contained" icon="login" style={styles.button} loading={loading} onPress={handleLogin}>Login</Button>
                            <Text style={{paddingVertical: 10}}>Or</Text>
                            <Button mode="outlined" icon="account-plus" style={{width: '100%'}} onPress={() => props.navigation.navigate('Signup')}>Signup</Button>
                        </View>
                    </View>
                }
            </View>
        </ScrollView>
    )
}

