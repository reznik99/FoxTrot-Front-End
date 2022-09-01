import React, { useState, useCallback } from 'react'
import { View, ScrollView } from 'react-native'
import { useSelector, useDispatch } from 'react-redux'
import { Button, TextInput, Text  } from 'react-native-paper'

import styles from './style'
import { signUp } from '~/store/actions/auth'


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
                    outlineColor={signupErr && !username ? "red"  : null}
                />
                <TextInput mode="outlined"  
                    onChangeText={val => setPassword(val)}
                    value={password}
                    secureTextEntry={true}
                    label="Password"
                    outlineColor={signupErr && !password ? "red"  : null}
                />
                <TextInput mode="outlined" 
                    onChangeText={val => setRePassword(val)}
                    value={rePassword}
                    secureTextEntry={true}
                    label="Repeat Password"
                    outlineColor={signupErr && (!rePassword || rePassword !== password) ? "red"  : null}
                />

                {/* Actions */}
                <View style={{marginTop: 30, display: 'flex', alignItems: 'center'}}>
                    <Button mode="contained" icon="account-plus" style={styles.button} onPress={signup} loading={loading}>Signup</Button>
                </View>
            </View>
        </ScrollView>
    );
}

