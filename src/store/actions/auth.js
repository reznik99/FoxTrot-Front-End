import axios from 'axios'
import AsyncStorage from '@react-native-community/async-storage'

import { API_URL } from '../../global/variables'

export function logIn(phone_no, password) {
    return async (dispatch) => {
        if (phone_no === '' || password === '') {
            dispatch({
                type: "ERROR_MSG",
                payload: "Textfields cannot be blank!",
            })
            return;
        }
        try {
            dispatch({
                type: "SET_LOADING",
                payload: true,
            })
            const res = await axios.post(`${API_URL}/login`, {
                phone_no: phone_no,
                password: password
            })
            // Save data in redux store
            dispatch({
                type: "LOGGED_IN",
                payload: {
                    token: res.data.token,
                    phone_no: phone_no
                },
            })
            // Save data in phone storage
            AsyncStorage.setItem('user', phone_no)
            AsyncStorage.setItem('JWT', res.data.token)
            return true
        }
        catch (err) {
            console.error(`Error logging in: ${err}`)
            dispatch({
                type: "ERROR_MSG",
                payload: err.response?.data,
            })
            return false
        }
        finally {
            dispatch({
                type: "SET_LOADING",
                payload: false,
            })
        }
    }
}

export function signUp(phone_no, password, re_password) {
    return async (dispatch) => {
        if (phone_no === '' || password === '' || re_password === '') {
            dispatch({
                type: "ERROR_MSG",
                payload: "Textfields cannot be blank!",
            })
            return
        } else if (password !== re_password) {
            dispatch({
                type: "ERROR_MSG",
                payload: "Passwords do not match!",
            })
            return
        }
        try {
            dispatch({
                type: "SET_LOADING",
                payload: true,
            })
            const res = await axios.post(`${API_URL}/signup`, {
                phone_no: phone_no,
                password: password
            })
            // Save data in phone storage
            AsyncStorage.setItem('user', phone_no)
            return true
        }
        catch (err) {
            console.error(`Error logging in: ${err}`)
            dispatch({
                type: "ERROR_MSG",
                payload: err.response?.data,
            })
            return false
        }
        finally {
            dispatch({
                type: "SET_LOADING",
                payload: false,
            })
        }
    }
}