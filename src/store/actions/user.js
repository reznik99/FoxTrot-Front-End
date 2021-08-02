import axios from 'axios'
import AsyncStorage from '@react-native-community/async-storage'
import { RSA } from 'react-native-rsa-native'

import { API_URL } from '../../global/variables'

export function generateAndSyncKeys() {
    return async (dispatch, getState) => {
        try {
            dispatch({ type: "SET_LOADING", payload: true })

            let state = getState().userReducer
            // Generate Keypair
            const keys = await RSA.generateKeys(4096)
            // Store on device 
            await userData.writeToStorage('rsa-user-keys', JSON.stringify(keys))
            // Upload public key
            const response = await axios.post(`${API_URL}/savePublicKey`, { publicKey: keys.publicKey }, axiosBearerConfig(state.token))
            // Store keypair in memory
            dispatch({ type: "KEY_GEN", payload: keys })

        } catch (err) {
            console.error(err)
        } finally {
            dispatch({ type: "SET_LOADING", payload: false })
        }
    }
}

export function loadMessages() {
    return async (dispatch, getState) => {
        try {
            dispatch({ type: "SET_REFRESHING", payload: true })

            let state = getState().userReducer
            // Load user conversations
            const conversations = new Map()

            const response = await axios.get(`${API_URL}/getConversations`, axiosBearerConfig(state.token))
            response.data = response.data.sort((msg1, msg2) => {
                let date1 = new Date(msg1.sent_at);
                let date2 = new Date(msg2.sent_at);
                return date1 - date2
            })

            // TODO: Fix this mess up
            response.data.forEach(message => {
                let other = message.sender === state.phone_no
                    ? { phone_no: message.reciever, id: message.reciever_id, pic: `https://robohash.org/${message.reciever}` }
                    : { phone_no: message.sender, id: message.sender_id }
                let exists = conversations.has(other.phone_no)
                if (!exists) {
                    conversations.set(other.phone_no, {
                        other_user: other,
                        messages: []
                    });
                }
                conversations.get(other.phone_no).messages.push(message)
            })

            const convos = [...conversations.values()].sort((c1, c2) => {
                if (!c1.messages || c1.messages.length <= 0)
                    return -1;
                if (!c2.messages || c2.messages.length <= 0)
                    return 1;
                return c1.messages[c1.messages.length - 1].sent_at < c2.messages[c2.messages.length - 1].sent_at ? 1 : -1
            })

            dispatch({ type: "LOAD_CONVERSATIONS", payload: convos })

        } catch (err) {
            console.error(`Error loading messages: ${err}`)
        } finally {
            dispatch({ type: "SET_REFRESHING", payload: false })
        }
    }
}

export function loadContacts() {
    return async (dispatch, getState) => {
        try {
            dispatch({ type: "SET_REFRESHING", payload: true })
            let state = getState().userReducer
            // Load contacts
            const response = await axios.get(`${API_URL}/getContacts`, axiosBearerConfig(state.token))

            const contacts = new Map()
            response.data.forEach(contact => {
                contacts.set(contact.nickname || contact.phone_no, { ...contact, pic: `https://robohash.org/${contact.phone_no}` })
            });

            dispatch({ type: "LOAD_CONTACTS", payload: contacts })

        } catch (err) {
            console.error(`Error loading contacts: ${err}`)
        } finally {
            dispatch({ type: "SET_REFRESHING", payload: false })
        }
    }
}

export function sendMessage(message, to_user) {
    return async (dispatch, getState) => {
        try {
            dispatch({ type: "SET_LOADING", payload: true })
            let state = getState().userReducer

            let msg = {
                message: message,
                sender: state.phone_no,
                reciever: to_user.phone_no,
                sent_at: Date.now(),
                seen: false
            }

            dispatch({ type: "SEND_MESSAGE", payload: msg })

            await axios.post(`${API_URL}/sendMessage`, { message: message, contact_id: to_user.id }, axiosBearerConfig(state.token))

        } catch (err) {
            console.error(`Error sending message: ${err}`)
        } finally {
            dispatch({ type: "SET_LOADING", payload: false })
        }
    }
}

export function validateToken() {
    return async (dispatch, getState) => {
        try {
            dispatch({ type: "SET_LOADING", payload: true })
            let state = getState().userReducer
            if (!state.token)
                return false

            const res = await axios.get(`${API_URL}/validateToken`, axiosBearerConfig(state.token))

            dispatch({ type: "TOKEN_VALID", payload: res.data?.valid })
            return res.data?.valid
        } catch (err) {
            console.log(`Error validating JWT: ${err}`)
            dispatch({ type: "TOKEN_VALID", payload: false })
            return false
        } finally {
            dispatch({ type: "SET_LOADING", payload: false })
        }
    }
}

export function syncFromStorage() {
    return async (dispatch) => {
        try {
            dispatch({ type: "SET_LOADING", payload: true })

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
            dispatch({ type: "SET_LOADING", payload: false })
        }
    }
}

function axiosBearerConfig(token) {
    return { headers: { "Authorization": `JWT ${token}` } }
}