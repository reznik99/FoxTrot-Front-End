import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Keychain from 'react-native-keychain'

import { API_URL } from '~/global/variables'
import { AppDispatch } from '../store'

export function logIn(phone_no: string, password: string) {
    return async (dispatch: AppDispatch) => {
        if (phone_no === '' || password === '') {
            dispatch({ type: "LOGIN_ERROR_MSG", payload: "Textfields cannot be blank!" })
            return;
        }
        try {
            dispatch({ type: "SET_LOADING", payload: true })

            const res = await axios.post(`${API_URL}/login`, {
                phone_no: phone_no,
                password: password
            })

            console.debug('Saving user in storage')
            // Save data in phone storage
            await AsyncStorage.setItem('user_data', JSON.stringify(res.data.user_data))
            await AsyncStorage.setItem('auth_token', res.data.token)

            // Save password in secure storage
            await Keychain.setGenericPassword(`${phone_no}-password`, password, {
                storage: Keychain.STORAGE_TYPE.AES,
                service: `${phone_no}-password`
            })

            // Save data in redux store
            dispatch({
                type: "LOGGED_IN",
                payload: {
                    token: res.data.token,
                    user_data: res.data.user_data
                },
            })

            return true
        }
        catch (err: any) {
            console.error("Error logging in: ", err)
            dispatch({ type: "LOGIN_ERROR_MSG", payload: err?.response?.data || err.message })
            return false
        }
        finally {
            dispatch({ type: "SET_LOADING", payload: false })
        }
    }
}

export function signUp(phone_no: string, password: string, re_password: string) {
    return async (dispatch: AppDispatch) => {
        if (!phone_no || !password || !re_password ) {
            dispatch({ type: "SIGNUP_ERROR_MSG", payload: "Textfields cannot be blank!" })
            return false
        } else if (password !== re_password) {
            dispatch({ type: "SIGNUP_ERROR_MSG", payload: "Passwords do not match!" })
            return false
        }
        dispatch({ type: "SIGNUP_ERROR_MSG", payload: "" })
        try {
            dispatch({ type: "SET_LOADING", payload: true })

            const response = await axios.post(`${API_URL}/signup`, {
                phone_no: phone_no,
                password: password
            })
            // Save data in phone storage
            await AsyncStorage.setItem('user_data', JSON.stringify(response.data?.user_data || { phone_no }))
            dispatch({ type: "SIGNED_UP", payload: response.data?.user_data || { phone_no },
            })
            return true
        }
        catch (err: any) {
            console.error("Error signing up: ", err)
            dispatch({ type: "SIGNUP_ERROR_MSG", payload: err.response?.data || err.message })
            return false
        }
        finally {
            dispatch({ type: "SET_LOADING", payload: false })
        }
    }
}

export function logOut(navigation: any) {
    return async (dispatch: AppDispatch) => {
        console.debug("Logging out")
        // Clear redux state
        dispatch({ type: "LOGOUT", payload: undefined })
        navigation.replace('Login', { data: { loggedOut: true } })
    }
}

export function setupInterceptors(navigation: any) {
    axios.interceptors.response.use(
        (response) => response, 
        (error) => {
            console.warn("Interceptor error: ", error)
            if ( error.response.status == 403) logOut(navigation)
            return Promise.reject(error);
        }
    );
}

