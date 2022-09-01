import React, { useState, useCallback } from 'react'
import { View, ScrollView } from 'react-native'
import { useSelector, useDispatch } from 'react-redux'
import { ActivityIndicator, Button, TextInput, Text  } from 'react-native-paper'

import styles from './style'
import { signUp } from '../../store/actions/auth'


export default function Signup(props) {

    const { signupErr, loading } = useSelector(state => state.userReducer)
    const dispatch = useDispatch()

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [rePassword, setRePassword] = useState('')


    const signup = useCallback(async () => {
        if (loading) return

        let res = await dispatch(signUp(username, password, rePassword))
        if (res) return props.navigation.navigate('Login')
    }, [username, password, rePassword, loading]);


    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.wrapper}>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>FoxTrot</Text>
                    <Text style={styles.subTitle}>secure communications</Text>
                </View>
                { signupErr && <Text style={styles.errorMsg}>{signupErr}</Text> }

                <TextInput mode="outlined" 
                    onChangeText={val => setUsername(val)}
                    value={username}
                    label="Phone number"
                    style={signupErr && !username ? { borderColor: "red" } : null}
                />
                <TextInput mode="outlined"  
                    onChangeText={val => setPassword(val)}
                    value={password}
                    secureTextEntry={true}
                    label="Password"
                    style={signupErr && !password ? { borderColor: "red" } : null}
                />
                <TextInput mode="outlined" 
                    onChangeText={val => setRePassword(val)}
                    value={rePassword}
                    secureTextEntry={true}
                    label="Repeat Password"
                    style={signupErr && (!rePassword || rePassword !== password) ? { borderColor: "red" } : null}
                />
                
                <Button mode="contained" style={[styles.button, styles.buttonCyan]} onPress={signup} loading={loading}>Signup</Button>
            </View>
        </ScrollView>
    );
}

