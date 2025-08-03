import axios from 'axios';
import * as Keychain from 'react-native-keychain';
import Toast from 'react-native-toast-message';
import messaging from '@react-native-firebase/messaging'; // Push Notifications

import { API_URL, KeypairAlgorithm, KeychainOpts } from '~/global/variables';
import { importKeypair, exportKeypair, generateSessionKeyECDH, encrypt, generateIdentityKeypair } from '~/global/crypto';
import { AppDispatch, GetState } from '~/store/store';
import { Conversation, UserData } from '~/store/reducers/user';
import { getPushNotificationPermission } from '~/global/permissions';
import { getAvatar } from '~/global/helper';
import { readFromStorage, writeToStorage } from '~/global/storage';

async function migrateKeysToNewStandard(username: string) {
    const credentials = await Keychain.getInternetCredentials(`${username}-keys`)
    // We are good
    if (!credentials || credentials.username !== `${username}-keys`) {
        return
    }
    console.debug("Migrating keypair in keychain ")
    // Need to migrate
    await Keychain.setInternetCredentials(API_URL, `${username}-keys`, credentials.password, {
        storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
        server: API_URL,
        service: `${username}-keys`
    })
    // Clear old one
    await Keychain.resetInternetCredentials({
        server: `${username}-keys`
    })
}

export function loadKeys() {
    return async (dispatch: AppDispatch, getState: GetState) => {
        try {
            dispatch({ type: "SET_LOADING", payload: true })

            let state = getState().userReducer
            if (state.keys) return true

            console.debug(`Loading '${KeypairAlgorithm.name} ${KeypairAlgorithm.namedCurve}' keys from secure storage`)
            await migrateKeysToNewStandard(state.user_data.phone_no)
            const credentials = await Keychain.getInternetCredentials(API_URL, {
                server: API_URL,
                service: `${state.user_data.phone_no}-keys`
            })
            if (!credentials || credentials.username !== `${state.user_data.phone_no}-keys`) {
                console.debug('Warn: No keys found. First time login on device')
                return false
            }

            const keys = await importKeypair(JSON.parse(credentials.password))

            // Store keypair in memory
            dispatch({ type: "KEY_LOAD", payload: keys })
            return true
        } catch (err: any) {
            console.error('Error loading keys:', err, JSON.stringify(await Keychain.getSupportedBiometryType()))
            Toast.show({
                type: 'error',
                text1: 'Failed to load Identity Keypair from TPM',
                text2: err.message ?? err.toString(),
                visibilityTime: 5000
            });
            return false
        } finally {
            dispatch({ type: "SET_LOADING", payload: false })
        }
    }
}

export function generateAndSyncKeys() {
    return async (dispatch: AppDispatch, getState: GetState) => {
        const state = getState().userReducer

        try {
            dispatch({ type: "SET_LOADING", payload: true })

            // Generate User's Keypair
            const keyPair = await generateIdentityKeypair()
            const keys = await exportKeypair(keyPair)
            console.debug(`Saving '${KeypairAlgorithm.name} ${KeypairAlgorithm.namedCurve}' keys to secure storage`)

            // Store on device
            await Keychain.setInternetCredentials(API_URL, `${state.user_data.phone_no}-keys`, JSON.stringify(keys), {
                storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
                server: API_URL,
                service: `${state.user_data.phone_no}-keys`
            })

            // Upload public key
            await axios.post(`${API_URL}/savePublicKey`, { publicKey: keys.publicKey }, axiosBearerConfig(state.token))

            // Store keypair in memory
            dispatch({ type: "KEY_LOAD", payload: keyPair })
            return true

        } catch (err: any) {
            await Keychain.resetInternetCredentials({ server: API_URL, service: `${state.user_data?.phone_no}-keys`}),
            console.error('Error generating and syncing keys:', err)
            Toast.show({
                type: 'error',
                text1: 'Failed to generate Identity Keypair',
                text2: err.message ?? err.toString(),
                visibilityTime: 5000
            });
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

            // Check last time we hit the API for messages
            const cachedLastChecked = (await readFromStorage(`messages-${state.user_data.id}-last-checked`)) || '0'

            let lastChecked = parseInt(cachedLastChecked)
            let previousConversations = new Map<string, Conversation>()

            // Load bulk messages from storage if there aren't any in the redux state
            if (!state.conversations.size) {
                try {
                    const cachedConversations = await readFromStorage(`messages-${state.user_data.id}`)
                    if (!cachedConversations) throw new Error("No cached messages")

                    previousConversations = new Map(JSON.parse(cachedConversations))
                    console.debug(`Loaded ${previousConversations.size} conversations from storage. Last checked ${lastChecked}`)
                } catch (err: any) {
                    console.warn('Failed to load messages from storage: ', err)
                }
            } else {
                previousConversations = new Map(state.conversations)
            }

            // If no cached conversations, load all from API just in case.
            if (!previousConversations.size) lastChecked = 0

            // Load new user messages
            const conversations = new Map(previousConversations)
            const response = await axios.get(`${API_URL}/getConversations/?since=${lastChecked}`, axiosBearerConfig(state.token))
            response.data = response.data.reverse()

            response.data.forEach((message: any) => {
                let other = message.sender === state.user_data.phone_no
                    ? { phone_no: message.reciever, id: message.reciever_id, pic: getAvatar(message.reciever_id) }
                    : { phone_no: message.sender, id: message.sender_id, pic: getAvatar(message.sender_id) }
                if (conversations.has(other.phone_no)) {
                    conversations.get(other.phone_no)?.messages.unshift(message)
                } else {
                    conversations.set(other.phone_no, {
                        other_user: other,
                        messages: [message]
                    });
                }
            })
            console.debug(`Loaded ${response.data?.length} new messages from api`)

            // Save all new conversations to redux state
            dispatch({ type: "LOAD_CONVERSATIONS", payload: conversations })

            // Save all conversations to local-storage so we don't reload them unnecessarily from the API
            await Promise.all([
                writeToStorage(`messages-${state.user_data.id}`, JSON.stringify(Array.from(conversations.entries()))),
                writeToStorage(`messages-${state.user_data.id}-last-checked`, String(Date.now()))
            ])

        } catch (err: any) {
            console.error('Error loading messages:', err)
            Toast.show({
                type: 'error',
                text1: 'Error loading messages',
                text2: err.message ?? err.toString(),
                visibilityTime: 5000
            });
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

            const contacts = await Promise.all(response.data.map(async (contact: any) => {
                try {
                    const session_key = await generateSessionKeyECDH(contact.public_key || '', state.keys?.privateKey)
                    return { ...contact, pic: getAvatar(contact.id), session_key }
                } catch (err: any) {
                    console.warn("Failed to generate session key:", contact.phone_no, err.message || err)
                    return { ...contact, pic: getAvatar(contact.id) }
                }
            }))

            dispatch({ type: "LOAD_CONTACTS", payload: contacts })

        } catch (err: any) {
            console.error('Error loading contacts:', err)
            Toast.show({
                type: 'error',
                text1: 'Error loading contacts',
                text2: err.message ?? err.toString(),
                visibilityTime: 5000
            });
        } finally {
            if (atomic) dispatch({ type: "SET_REFRESHING", payload: false })
        }
    }
}

export function addContact(user: UserData) {
    return async (dispatch: AppDispatch, getState: GetState) => {
        try {
            let state = getState().userReducer
            const { data } = await axios.post(`${API_URL}/addContact`, { id: user.id }, axiosBearerConfig(state.token))
            const session_key = await generateSessionKeyECDH(data.public_key || '', state.keys?.privateKey)

            dispatch({ type: "ADD_CONTACT_SUCCESS", payload: { ...data, pic: getAvatar(user.id), session_key } })
            return true
        } catch (err: any) {
            console.error('Error adding contact:', err)
            Toast.show({
                type: 'error',
                text1: 'Failed to add contact',
                text2: err.message || 'Please try again later',
                visibilityTime: 5000
            });
            return false
        }
    }
}

export function searchUsers(prefix: string) {
    return async (dispatch: AppDispatch, getState: GetState): Promise<UserData[]> => {
        try {
            dispatch({ type: "SET_LOADING", payload: true })
            const state = getState().userReducer

            const response = await axios.get(`${API_URL}/searchUsers/${prefix}`, axiosBearerConfig(state.token))

            // Append robot picture to users
            const results = response.data.map((user: any) => ({ ...user, pic: getAvatar(user.id), isContact: state.contacts.some(contact => contact.id === user.id) }))

            return results

        } catch (err: any) {
            console.error('Error searching users:', err)
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
            const state = getState().userReducer

            if (!to_user?.session_key) throw new Error("Missing session_key for " + to_user?.phone_no)

            // Encrypt and send message
            const encryptedMessage = await encrypt(to_user.session_key, message)
            await axios.post(`${API_URL}/sendMessage`, { message: encryptedMessage, contact_id: to_user.id, contact_phone_no: to_user.phone_no }, axiosBearerConfig(state.token))

            // Save message locally
            let msg = {
                sender: state.user_data,
                reciever: to_user,
                rawMessage: {
                    id: Date.now(),
                    message: encryptedMessage,
                    sender: state.user_data.phone_no,
                    reciever: to_user.phone_no,
                    sent_at: Date.now(),
                    seen: false
                }
            }
            dispatch({ type: "SEND_MESSAGE", payload: msg })

            // Save all conversations to local-storage so we don't reload them unnecessarily from the API
            writeToStorage(`messages-${state.user_data.id}`, JSON.stringify(Array.from(getState().userReducer.conversations.entries())))
            writeToStorage(`messages-${state.user_data.id}-last-checked`, String(Date.now()))
            return true
        } catch (err: any) {
            console.error('Error sending message:', err)
            Toast.show({
                type: 'error',
                text1: 'Error sending message',
                text2: err.message ?? err.toString()
            });
            return false
        } finally {
            dispatch({ type: "SET_LOADING", payload: false })
        }
    }
}

export function validateToken(token: string) {
    return async (dispatch: AppDispatch, getState: GetState) => {
        try {
            dispatch({ type: "SET_LOADING", payload: true })
            if (!token) return false

            const res = await axios.get(`${API_URL}/validateToken`, axiosBearerConfig(token))

            dispatch({ type: "TOKEN_VALID", payload: { token: token, valid: res.data?.valid } })
            return res.data?.valid
        } catch (err: any) {
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
            // TODO: Load existing contacts from async storage
            // const token = await readFromStorage('auth_token')
            const user_data = await readFromStorage('user_data')
            if (!user_data) return false

            const payload = {
                user_data: JSON.parse(user_data),
            }
            dispatch({ type: "SYNC_FROM_STORAGE", payload: payload })
            return true
        } catch (err: any) {
            console.error('Error syncing from storage:', err)
            Toast.show({
                type: 'error',
                text1: 'Failed to sync data from storage',
                text2: err.message ?? err.toString(),
                visibilityTime: 5000
            });
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
            const granted = await getPushNotificationPermission()
            if (granted) {
                await messaging().registerDeviceForRemoteMessages();
                const token = await messaging().getToken();
                await axios.post(`${API_URL}/registerPushNotifications`, { token }, axiosBearerConfig(state.token))
                // Register background handler
                // messaging().setBackgroundMessageHandler(async remoteMessage => {
                //     console.log('Message handled in the background!', remoteMessage);
                // });
            } else {
                console.error("Push notifications permission denied")
            }

        } catch (err: any) {
            console.error('Error Registering for Push Notifications:', err)
            Toast.show({
                type: 'error',
                text1: 'Failed to register for push notifications',
                text2: err.message ?? err.toString(),
                visibilityTime: 5000
            });
        }
    }
}

function axiosBearerConfig(token: string) {
    return { headers: { "Authorization": `JWT ${token}` } }
}