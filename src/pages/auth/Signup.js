import React, { useState, useCallback } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { Button, Input, Text } from 'galio-framework';
import { useSelector, useDispatch } from 'react-redux';

import styles from './style'
import { signUp } from '../../store/actions/auth'


export default function Signup(props) {

    const { errorMsg, loading, phone_no } = useSelector(state => state.userReducer)
    const dispatch = useDispatch()

    const [phone_number, setPhone_number] = useState('')
    const [password, setPassword] = useState('')
    const [rePassword, setRePassword] = useState('')


    const signup = useCallback(async () => {
        let res = await dispatch(signUp(phone_number, password, rePassword))
        if (res)
            return props.navigation.navigate('Login')
    }, [phone_number, password, rePassword]);


    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.wrapper}>
                <View style={styles.logoView}>
                    <Text style={styles.title} h4>FoxTrot</Text>
                    <Text style={styles.title} h6 muted>secure communications</Text>
                </View>
                {errorMsg ? <Text style={styles.errorMsg}>{errorMsg}</Text> : null}
                <Input onChangeText={val => setPhone_number(val)}
                    style={errorMsg && phone_number === '' ? { borderColor: "red" } : null}
                    help="Phone number"
                    placeholder="+64222222222"
                    placeholderTextColor="#333"
                />
                <Input onChangeText={val => setPassword(val)}
                    style={errorMsg && password === '' ? { borderColor: "red" } : null}
                    secureTextEntry={true}
                    help="Password"
                    placeholder="********"
                    placeholderTextColor="#333"
                />
                <Input onChangeText={val => setRePassword(val)}
                    style={errorMsg && (rePassword === '' || rePassword != password) ? { borderColor: "red" } : null}
                    secureTextEntry={true}
                    help="Repeat Password"
                    placeholder="********"
                    placeholderTextColor="#333"
                />
                {loading
                    ? <Button style={[styles.button, styles.buttonCyan]}><ActivityIndicator color="#00FFFF" /></Button>
                    : <Button style={[styles.button, styles.buttonCyan]} onPress={signup}>Signup</Button>
                }
            </View>
        </ScrollView>
    );
}

