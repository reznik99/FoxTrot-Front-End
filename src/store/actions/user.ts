import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Storage
import * as Keychain from 'react-native-keychain';
import messaging from '@react-native-firebase/messaging'; // Push Notifications

import { API_URL, KeypairAlgorithm, KeychainOpts } from '~/global/variables';
import { importKeypair, exportKeypair, generateSessionKeyECDH, encrypt } from '~/global/crypto';
import { AppDispatch, GetState } from '~/store/store';
import { UserData } from '../reducers/user';

export function loadKeys() {
    return async (dispatch: AppDispatch, getState: GetState) => {
        try {
            dispatch({ type: "SET_LOADING", payload: true })

            let state = getState().userReducer
            if(state.keys) return true

            console.debug(`Loading '${KeypairAlgorithm.name} ${KeypairAlgorithm.namedCurve}' keys from secure storage`)

            const credentials = await Keychain.getInternetCredentials(`${state.user_data.phone_no}-keys`, KeychainOpts)
            if (!credentials || credentials.service !== `${state.user_data.phone_no}-keys`) {
                console.debug('Warn: No keys found. First time login on device')
                return false
            }

            const keys = await importKeypair(JSON.parse(credentials.password))

            // Store keypair in memory
            dispatch({ type: "KEY_LOAD", payload: keys })
            return true
        } catch (err) {
            console.error('Error loading keys:', err, JSON.stringify(await Keychain.getSupportedBiometryType()))
            return false
        } finally {
            dispatch({ type: "SET_LOADING", payload: false })
        }
    }
}

export function generateAndSyncKeys() {
    return async (dispatch: AppDispatch, getState: GetState) => {
        try {
            dispatch({ type: "SET_LOADING", payload: true })

            let state = getState().userReducer

            // Generate User's Keypair
            const keyPair = await window.crypto.subtle.generateKey(
                KeypairAlgorithm,
                true,
                ["deriveKey"]
            )
            const keys = await exportKeypair(keyPair)
            console.debug(`Saving '${KeypairAlgorithm.name} ${KeypairAlgorithm.namedCurve}' keys to secure storage`)

            // Store on device
            await Keychain.setInternetCredentials(`${state.user_data.phone_no}-keys`, `${state.user_data.phone_no}-keys`, JSON.stringify(keys), {
                accessControl: Keychain.ACCESS_CONTROL.DEVICE_PASSCODE,
                authenticationPrompt: KeychainOpts.authenticationPrompt,
                storage: Keychain.STORAGE_TYPE.AES,
            })

            // Upload public key
            await axios.post(`${API_URL}/savePublicKey`, { publicKey: keys.publicKey }, axiosBearerConfig(state.token))

            // Store keypair in memory
            dispatch({ type: "KEY_LOAD", payload: keyPair })
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
    return async (dispatch: AppDispatch, getState: GetState) => {
        try {
            dispatch({ type: "SET_REFRESHING", payload: true })

            let state = getState().userReducer
            // Load user conversations
            const conversations = new Map()

            const response = await axios.get(`${API_URL}/getConversations`, axiosBearerConfig(state.token))
            response.data = response.data.sort((msg1: any, msg2: any): any => {
                let date1 = new Date(msg1.sent_at).getTime();
                let date2 = new Date(msg2.sent_at).getTime();
                return date1 - date2
            })

            // TODO: Fix this mess up
            response.data.forEach((message: any) => {
                let other = message.sender === state.user_data.phone_no
                    ? { phone_no: message.reciever, id: message.reciever_id, pic: `https://robohash.org/${message.reciever_id}` }
                    : { phone_no: message.sender, id: message.sender_id, pic: `https://robohash.org/${message.sender_id}` }
                let exists = conversations.has(other.phone_no)
                if (!exists) {
                    conversations.set(other.phone_no, {
                        other_user: other,
                        messages: []
                    });
                }
                conversations.get(other.phone_no).messages.push(message)
            })

            dispatch({ type: "LOAD_CONVERSATIONS", payload: conversations })

        } catch (err) {
            console.error(`Error loading messages: ${err}`)
        } finally {
            dispatch({ type: "SET_REFRESHING", payload: false })
        }
    }
}

export function loadContacts(atomic = true) {
    return async (dispatch: AppDispatch, getState: GetState) => {
        try {
            dispatch({ type: "SET_REFRESHING", payload: true })
            let state = getState().userReducer

            // Load contacts
            const response = await axios.get(`${API_URL}/getContacts`, axiosBearerConfig(state.token))

            const contacts = await Promise.all( response.data.map(async (contact: any) => {
                try {
                    const cryptoKey = await generateSessionKeyECDH(contact.public_key || '', state.keys?.privateKey)
                    return { ...contact, pic: `https://robohash.org/${contact.id}`, sessionKey: cryptoKey }
                } catch (err) {
                    console.warn("Failed to generate session key:", contact.phone_no, err)
                    return { ...contact, pic: `https://robohash.org/${contact.id}` }
                }
            }))

            dispatch({ type: "LOAD_CONTACTS", payload: contacts })

        } catch (err) {
            console.error('Error loading contacts:', err)
        } finally {
            if(atomic) dispatch({ type: "SET_REFRESHING", payload: false })
        }
    }
}

export function addContact(user: any) {
    return async (dispatch: AppDispatch, getState: GetState) => {
        try {
            let state = getState().userReducer
            await axios.post(`${API_URL}/addContact`, { id: user.id }, axiosBearerConfig(state.token))
            const sessionKey = await generateSessionKeyECDH(user.public_key || '', state.keys?.privateKey)

            dispatch({ type: "ADD_CONTACT_SUCCESS", payload: {...user, sessionKey} })
            return true
        } catch (err) {
            console.error(`Error adding contact: ${err}`)
            return false
        }
    }
}

export function searchUsers(prefix: string) {
    return async (dispatch: AppDispatch, getState: GetState) => {
        try {
            dispatch({ type: "SET_LOADING", payload: true })
            const state = getState().userReducer

            const response = await axios.get(`${API_URL}/searchUsers/${prefix}`, axiosBearerConfig(state.token))

            // Append fake picture to users
            const results = response.data.map((user: any) => ({ ...user, pic: `https://robohash.org/${user.id}`, isContact: state.contacts.some(contact => contact.id === user.id) }))

            return results

        } catch (err) {
            console.error(`Error searching users: ${err}`)
            return []
        } finally {
            dispatch({ type: "SET_LOADING", payload: false })
        }
    }
}

export function sendMessage(message: string, to_user: UserData) {
    return async (dispatch: AppDispatch, getState: GetState) => {
        try {
            dispatch({ type: "SET_LOADING", payload: true })
            let state = getState().userReducer

            const peer = state.contacts.find((contact) => contact.id === to_user.id)
            if(!peer || !peer.sessionKey) throw new Error("Cannot message a User who isn't a contact")

            // Save message locally
            let msg = {
                sender: state.user_data,
                reciever: to_user,
                rawMessage: {
                    message: message,
                    sender: state.user_data.phone_no,
                    reciever: to_user.phone_no,
                    sent_at: Date.now(),
                    seen: false
                }
            }

            dispatch({ type: "SEND_MESSAGE", payload: msg })

            // Encrypt message
            const encryptedMessage = await encrypt(peer.sessionKey, message)

            await axios.post(`${API_URL}/sendMessage`, { message: encryptedMessage, contact_id: to_user.id, contact_phone_no: to_user.phone_no }, axiosBearerConfig(state.token))

        } catch (err) {
            console.error('Error sending message:', err)
        } finally {
            dispatch({ type: "SET_LOADING", payload: false })
        }
    }
}

export function validateToken() {
    return async (dispatch: AppDispatch, getState: GetState) => {
        try {
            dispatch({ type: "SET_LOADING", payload: true })
            let state = getState().userReducer

            if (!state.token) return false

            const res = await axios.get(`${API_URL}/validateToken`, axiosBearerConfig(state.token))

            dispatch({ type: "TOKEN_VALID", payload: res.data?.valid })
            return res.data?.valid
        } catch (err) {
            dispatch({ type: "TOKEN_VALID", payload: false })
            return false
        } finally {
            dispatch({ type: "SET_LOADING", payload: false })
        }
    }
}

export function syncFromStorage() {
    return async (dispatch: AppDispatch) => {
        try {
            dispatch({ type: "SET_LOADING", payload: true })

            console.debug('Loading user from local storage')
            const user_data = await AsyncStorage.getItem('user_data')
            const token = await AsyncStorage.getItem('auth_token')

            // TODO: Load existing messages/contacts and stuff

            if(!user_data || !token) return false

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
    return async (dispatch: AppDispatch, getState: GetState) => {
        try {
            let state = getState().userReducer
            
            console.debug('Registering for Push Notifications');
            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (enabled) {
                await messaging().registerDeviceForRemoteMessages();
                const token = await messaging().getToken();
                await axios.post(`${API_URL}/registerPushNotifications`, {token}, axiosBearerConfig(state.token))
                // Register background handler
                // messaging().setBackgroundMessageHandler(async remoteMessage => {
                //     console.log('Message handled in the background!', remoteMessage);
                // });
            }

        } catch (err) {
            console.error('Error Registering for Push Notifications:', err)
        }
    }
}

function axiosBearerConfig(token: string) {
    return { headers: { "Authorization": `JWT ${token}` } }
}