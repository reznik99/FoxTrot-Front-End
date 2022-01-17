import axios from 'axios'
import AsyncStorage from '@react-native-community/async-storage'
import { RSA } from 'react-native-rsa-native'

import { API_URL } from '../../global/variables'

export function loadKeys() {
    return async (dispatch, getState) => {
        try {
            dispatch({ type: "SET_LOADING", payload: true })

            let state = getState().userReducer

            console.log('Loading Crypto Keys from local storage into store')
            const keys = await AsyncStorage.getItem(state.user_data.phone_no + "-keys")
            if (!keys) throw Error("No keys")

            // Store keypair in memory
            dispatch({ type: "KEY_LOAD", payload: JSON.parse(keys) })
            return true
        } catch (err) {
            console.log(`Couldn't find keys for user in storage: ${err}`)
            return false
        } finally {
            dispatch({ type: "SET_LOADING", payload: false })
        }
    }
}

export function generateAndSyncKeys() {
    return async (dispatch, getState) => {
        try {
            dispatch({ type: "SET_LOADING", payload: true })

            let state = getState().userReducer
            // Generate Keypair
            const keys = await RSA.generateKeys(4096)
            console.log("Generated RSA 4096 Keypair. Storing in: " + state.user_data.phone_no + "-keys")
            // Store on device 
            await AsyncStorage.setItem(state.user_data.phone_no + "-keys", JSON.stringify(keys))
            // Upload public key
            const response = await axios.post(`${API_URL}/savePublicKey`, { publicKey: keys.public }, axiosBearerConfig(state.token))
            // Store keypair in memory
            dispatch({ type: "KEY_GEN", payload: keys })

        } catch (err) {
            console.log(`Error generating and syncing keys: ${err}`)
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
                let other = message.sender === state.user_data.phone_no
                    ? { phone_no: message.reciever, id: message.reciever_id, pic: `https://robohash.org/${message.reciever}` }
                    : { phone_no: message.sender, id: message.sender_id, pic: `https://robohash.org/${message.sender}` }
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

            const contacts = response.data.map(contact => ({ ...contact, pic: `https://robohash.org/${contact.phone_no}` }));

            dispatch({ type: "LOAD_CONTACTS", payload: contacts })

        } catch (err) {
            console.log(`Error loading contacts: ${err}`)
        } finally {
            dispatch({ type: "SET_REFRESHING", payload: false })
        }
    }
}

export function addContact(user) {
    return async (dispatch, getState) => {
        try {
            dispatch({ type: "ADDING_CONTACT", payload: user })
            let state = getState().userReducer
            // Load contacts
            await axios.post(`${API_URL}/addContact`, { id: user.id }, axiosBearerConfig(state.token))

            dispatch({ type: "ADD_CONTACT_SUCCESS", payload: user })
        } catch (err) {
            console.log(`Error adding contact: ${err}`)
        } finally {
            dispatch({ type: "ADD_CONTACT_FAILURE", payload: user })
        }
    }
}

export function clearAddingContact() {
    return (dispatch) => {
        dispatch({ type: "ADDING_CONTACT", payload: null })
        dispatch({ type: "ADD_CONTACT_FAILURE", payload: null })
    }
}

export function searchUsers(prefix) {
    return async (dispatch, getState) => {
        try {
            dispatch({ type: "SET_LOADING", payload: true })
            let state = getState().userReducer

            const response = await axios.get(`${API_URL}/searchUsers/${prefix}`, axiosBearerConfig(state.token))

            // Append fake picture to users
            const results = response.data.map(user => ({ ...user, pic: `https://robohash.org/${user.phone_no}`, isContact: state.contacts.some(contact => contact.id === user.id) }))

            return results

        } catch (err) {
            console.log(`Error searching users: ${err}`)
            return []
        } finally {
            dispatch({ type: "SET_LOADING", payload: false })
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
                sender: state.user_data.phone_no,
                reciever: to_user.phone_no,
                sent_at: Date.now(),
                seen: false
            }

            dispatch({ type: "SEND_MESSAGE", payload: msg })

            await axios.post(`${API_URL}/sendMessage`, { message: message, contact_id: to_user.id }, axiosBearerConfig(state.token))

        } catch (err) {
            console.log(`Error sending message: ${err}`)
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

            console.log('Loading user_data from local storage into store')
            const user_data = await AsyncStorage.getItem('user_data')

            console.log('Loading JSON Web Token from local storage into store')
            const token = await AsyncStorage.getItem('auth_token')

            const payload = {
                token: token,
                user_data: JSON.parse(user_data),
            }
            dispatch({
                type: "SYNC_FROM_STORAGE",
                payload: payload,
            })
        } catch (err) {
            console.error(`Error syncing from storage: ${err}`)
        } finally {
            dispatch({ type: "SET_LOADING", payload: false })
        }
    }
}

function axiosBearerConfig(token) {
    return { headers: { "Authorization": `JWT ${token}` } }
}