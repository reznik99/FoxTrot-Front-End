import axios from 'axios';
// Storage
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
// Push Notifications
import messaging from '@react-native-firebase/messaging'
// Crypto
var Buffer = require("@craftzdog/react-native-buffer").Buffer;

import { API_URL, UserKeypairConf, KeychainOpts } from '~/global/variables';

export function loadKeys() {
    return async (dispatch, getState) => {
        try {
            dispatch({ type: "SET_LOADING", payload: true })

            let state = getState().userReducer

            console.debug(`Loading '${UserKeypairConf.name} ${UserKeypairConf.modulusLength}' keys from secure storage`)

            const credentials = await Keychain.getInternetCredentials(`${state.user_data.phone_no}-keys`, KeychainOpts)
            if (!credentials || credentials.service !== `${state.user_data.phone_no}-keys`) {
                console.debug('Warn: No keys found. First time login on device')
                return false
            }
            
            // Store keypair in memory
            dispatch({ type: "KEY_LOAD", payload: JSON.parse(credentials.password) })
            return true
        } catch (err) {
            console.error(`Error loading keys: ${err}: ${JSON.stringify(await Keychain.getSupportedBiometryType())}`)
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

            // Generate RSA Keypair
            const keyPair = await window.crypto.subtle.generateKey(
                UserKeypairConf,
                true,
                ['sign', 'verify']
            )
            const keys = {
                public: Buffer.from(await window.crypto.subtle.exportKey('spki', keyPair.publicKey)).toString('base64'),
                private: Buffer.from(await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey)).toString('base64')
            }
            console.debug(`Saving '${UserKeypairConf.name} ${UserKeypairConf.modulusLength}' keys to secure storage`)

            // Store on device
            await Keychain.setInternetCredentials(`${state.user_data.phone_no}-keys`, `${state.user_data.phone_no}-keys`, JSON.stringify(keys), {
                accessControl: Keychain.ACCESS_CONTROL.DEVICE_PASSCODE,
                authenticationPrompt: KeychainOpts.authenticationPrompt,
                storage: Keychain.STORAGE_TYPE.AES,
            })

            // Upload public key
            await axios.post(`${API_URL}/savePublicKey`, { publicKey: keys.public }, axiosBearerConfig(state.token))

            // Store keypair in memory
            dispatch({ type: "KEY_LOAD", payload: keys })
            return true

        } catch (err) {
            console.error(`Error generating and syncing keys: ${err}`)
            return false
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
            console.error(`Error loading contacts: ${err}`)
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
            console.error(`Error adding contact: ${err}`)
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
            console.error(`Error searching users: ${err}`)
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
            console.error(`Error validating JWT: ${err}`)
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

            console.debug('Loading user from local storage')
            const user_data = await AsyncStorage.getItem('user_data')
            const token = await AsyncStorage.getItem('auth_token')

            // TODO: Load existing messages/contacts and stuff

            if(!user_data && !token) return false

            const payload = {
                token: token,
                user_data: JSON.parse(user_data),
            }
            dispatch({
                type: "SYNC_FROM_STORAGE",
                payload: payload,
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

export function registerPushNotifications() {
    return async (dispatch, getState) => {
        try {
            dispatch({ type: "SET_LOADING", payload: true })
            let state = getState().userReducer
            
            console.debug('Registering for Push Notifications');
            await messaging().registerDeviceForRemoteMessages();
            const token = await messaging().getToken();

            await axios.post(`${API_URL}/registerPushNotifications`, {token}, axiosBearerConfig(state.token))

        } catch (err) {
            console.error('Error Registering for Push Notifications:', err)
        } finally {
            dispatch({ type: "SET_LOADING", payload: false })
        }
    }
}

function axiosBearerConfig(token) {
    return { headers: { "Authorization": `JWT ${token}` } }
}