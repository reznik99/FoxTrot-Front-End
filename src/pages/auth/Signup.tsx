import React, { useState, useCallback } from 'react';
import { View, ScrollView } from 'react-native';
import { Button, TextInput, Text } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';
import { AnyAction } from 'redux';

import styles from './style';
import { signUp } from '~/store/actions/auth';
import { RootState } from '~/store/store';

interface IProps {
    navigation: any;
}

type AppDispatch = ThunkDispatch<any, any, AnyAction>


export default function Signup(props: IProps) {
    const { signupErr, loading } = useSelector((state: RootState) => state.userReducer);
    const dispatch = useDispatch<AppDispatch>();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rePassword, setRePassword] = useState('');

    const signup = useCallback(async () => {
        if (loading) {return;}

        const res = await dispatch(signUp(username, password, rePassword));
        if (res) {return props.navigation.navigate('Login');}
    }, [username, password, rePassword, loading]);

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.wrapper}>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>FoxTrot</Text>
                    <Text style={styles.subTitle}>secure communications</Text>
                </View>
                {signupErr && <Text style={styles.errorMsg}>{signupErr}</Text>}

                <TextInput mode="outlined"
                    onChangeText={val => setUsername(val.trim())}
                    value={username}
                    label="Username"
                    outlineColor={signupErr && !username ? 'red' : undefined}
                />
                <TextInput mode="outlined"
                    onChangeText={val => setPassword(val.trim())}
                    value={password}
                    secureTextEntry={true}
                    label="Password"
                    outlineColor={signupErr && !password ? 'red' : undefined}
                />
                <TextInput mode="outlined"
                    onChangeText={val => setRePassword(val.trim())}
                    value={rePassword}
                    secureTextEntry={true}
                    label="Repeat Password"
                    outlineColor={signupErr && (!rePassword || rePassword !== password) ? 'red' : undefined}
                />

                {/* Actions */}
                <View style={{ marginTop: 30, display: 'flex', alignItems: 'center' }}>
                    <Button mode="contained" icon="account-plus" style={styles.button} onPress={signup} loading={loading}>Signup</Button>
                </View>
            </View>
        </ScrollView>
    );
}

