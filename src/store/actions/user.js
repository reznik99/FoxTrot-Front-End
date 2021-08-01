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

export function validateToken() {
    return async (dispatch, getState) => {
        try {
            dispatch({
                type: "SET_LOADING",
                payload: true,
            })
            let state = getState()
            if (state.userReducer?.token != '') {
                const res = await axios.get(`${API_URL}/validateToken`, axiosBearerConfig(state.userReducer.token))
                dispatch({
                    type: "TOKEN_VALID",
                    payload: res.data?.valid,
                })
                return res.data?.valid
            }
            return false
        } catch (err) {
            console.error(`Error validating JWT: ${err}`)
            dispatch({
                type: "TOKEN_VALID",
                payload: false,
            })
            return false
        } finally {
            dispatch({
                type: "SET_LOADING",
                payload: false,
            })
        }
    }
}

export function syncFromStorage() {
    return async (dispatch) => {
        try {
            dispatch({
                type: "SET_LOADING",
                payload: true,
            })

            console.log('Reading keys from local storage into store')
            const keys = await AsyncStorage.getItem('rsa-user-keys')

            console.log('Reading JWT from local storage into store')
            const JWT = await AsyncStorage.getItem('JWT')

            console.log('Reading userInfo from local storage into store')
            const phone_no = await AsyncStorage.getItem('user')

            dispatch({
                type: "SYNC_FROM_STORAGE",
                payload: {
                    keys: JSON.parse(keys),
                    token: JWT,
                    phone_no: phone_no,
                },
            })

            return true
        } catch (err) {
            console.error(`Error syncing from storage: ${err}`)
            return false
        } finally {
            dispatch({
                type: "SET_LOADING",
                payload: false,
            })
        }
    }
}

function axiosBearerConfig(token) {
    return { headers: { "Authorization": `JWT ${token}` } }
}