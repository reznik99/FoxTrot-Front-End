import axios from 'axios';
import * as Keychain from 'react-native-keychain';
import Toast from 'react-native-toast-message';
import { getMessaging, getToken, registerDeviceForRemoteMessages } from '@react-native-firebase/messaging'; // Push Notifications

import { API_URL, KeypairAlgorithm } from '~/global/variables';
import { importKeypair, exportKeypair, generateSessionKeyECDH, encrypt, generateIdentityKeypair } from '~/global/crypto';
import { AppDispatch, RootState } from '~/store/store';
import { ADD_CONTACT_SUCCESS, Conversation, KEY_LOAD, LOAD_CONTACTS, LOAD_CONVERSATIONS, message, SEND_MESSAGE, SET_LOADING, SET_REFRESHING, SYNC_FROM_STORAGE, TOKEN_VALID, UserData } from '~/store/reducers/user';
import { getPushNotificationPermission } from '~/global/permissions';
import { getAvatar } from '~/global/helper';
import { readFromStorage, writeToStorage } from '~/global/storage';
import { createAsyncThunk } from '@reduxjs/toolkit';

async function migrateKeysToNewStandard(username: string) {
    const credentials = await Keychain.getInternetCredentials(`${username}-keys`);
    // We are good
    if (!credentials || credentials.username !== `${username}-keys`) {
        return;
    }
    console.debug('Migrating keypair in keychain ');
    // Need to migrate
    await Keychain.setInternetCredentials(API_URL, `${username}-keys`, credentials.password, {
        storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
        server: API_URL,
        service: `${username}-keys`,
    });
    // Clear old one
    await Keychain.resetInternetCredentials({
        server: `${username}-keys`,
    });
}

const createDefaultAsyncThunk = createAsyncThunk.withTypes<{ state: RootState, dispatch: AppDispatch }>();

export const loadKeys = createDefaultAsyncThunk<boolean>('loadKeys', async (_, thunkAPI) => {
    try {
        thunkAPI.dispatch(SET_LOADING(true));

        let state = thunkAPI.getState().userReducer;
        if (state.keys) { return true; }

        console.debug(`Loading '${KeypairAlgorithm.name} ${KeypairAlgorithm.namedCurve}' keys from secure storage for user ${state.user_data.phone_no}`);
        await migrateKeysToNewStandard(state.user_data.phone_no);
        const credentials = await Keychain.getInternetCredentials(API_URL, {
            server: API_URL,
            service: `${state.user_data.phone_no}-keys`,
        });
        if (!credentials || credentials.username !== `${state.user_data.phone_no}-keys`) {
            console.debug('Warn: No keys found. First time login on device');
            return false;
        }

        const keys = await importKeypair(JSON.parse(credentials.password));

        // Store keypair in memory
        thunkAPI.dispatch(KEY_LOAD(keys));
        return true;
    } catch (err: any) {
        console.error('Error loading keys:', err, JSON.stringify(await Keychain.getSupportedBiometryType()));
        Toast.show({
            type: 'error',
            text1: 'Failed to load Identity Keypair from TPM',
            text2: err.message ?? err.toString(),
            visibilityTime: 5000,
        });
        return false;
    } finally {
        thunkAPI.dispatch(SET_LOADING(false));
    }
});

export const generateAndSyncKeys = createDefaultAsyncThunk<boolean>('generateAndSyncKeys', async (_, thunkAPI) => {
    const state = thunkAPI.getState().userReducer;

    try {
        thunkAPI.dispatch(SET_LOADING(true));

        // Generate User's Keypair
        const keyPair = await generateIdentityKeypair();
        const keys = await exportKeypair(keyPair);

        // Upload public key
        console.debug(`Syncing '${KeypairAlgorithm.name} ${KeypairAlgorithm.namedCurve}' public key to server`);
        await axios.post(`${API_URL}/savePublicKey`, { publicKey: keys.publicKey }, axiosBearerConfig(state.token));

        // Store on device
        console.debug(`Saving '${KeypairAlgorithm.name} ${KeypairAlgorithm.namedCurve}' keys to secure storage`);
        await Keychain.setInternetCredentials(API_URL, `${state.user_data.phone_no}-keys`, JSON.stringify(keys), {
            storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
            server: API_URL,
            service: `${state.user_data.phone_no}-keys`,
        });

        // Store keypair in memory
        thunkAPI.dispatch(KEY_LOAD(keyPair));
        return true;

    } catch (err: any) {
        await Keychain.resetInternetCredentials({ server: API_URL, service: `${state.user_data?.phone_no}-keys` });
        console.error('Error generating and syncing keys:', err);
        Toast.show({
            type: 'error',
            text1: 'Failed to generate Identity Keypair',
            text2: err.message ?? err.toString(),
            visibilityTime: 5000,
        });
        return false;
    } finally {
        thunkAPI.dispatch(SET_LOADING(false));
    }
});

export const loadMessages = createDefaultAsyncThunk('loadMessages', async (_, thunkAPI) => {
    try {
        thunkAPI.dispatch(SET_REFRESHING(true));

        let state = thunkAPI.getState().userReducer;

        // Check last time we hit the API for messages
        const cachedLastChecked = (await readFromStorage(`messages-${state.user_data.id}-last-checked`)) || '0';

        let lastChecked = parseInt(cachedLastChecked, 10);
        let previousConversations = new Map<string, Conversation>();

        // Load bulk messages from storage if there aren't any in the redux state
        if (!state.conversations.size) {
            try {
                const cachedConversations = await readFromStorage(`messages-${state.user_data.id}`);
                if (!cachedConversations) { throw new Error('No cached messages'); }

                previousConversations = new Map(JSON.parse(cachedConversations));
                console.debug('Loaded', previousConversations.size, 'conversations from storage. Last checked', lastChecked);
            } catch (err: any) {
                console.warn('Failed to load messages from storage: ', err);
            }
        } else {
            previousConversations = new Map(state.conversations);
            console.debug('Found', previousConversations.size, 'conversations in memory. Last checked', lastChecked);
        }

        // If no cached conversations, load all from API just in case.
        if (!previousConversations.size) { lastChecked = 0; }

        // Load new user messages
        const conversations = new Map(previousConversations);
        const response = await axios.get(`${API_URL}/getConversations/?since=${lastChecked}`, axiosBearerConfig(state.token));
        response.data = response.data.reverse();

        response.data.forEach((msg: message) => {
            let other = msg.sender === state.user_data.phone_no
                ? { phone_no: msg.reciever, id: msg.reciever_id, pic: getAvatar(msg.reciever_id) }
                : { phone_no: msg.sender, id: msg.sender_id, pic: getAvatar(msg.sender_id) };
            if (conversations.has(other.phone_no)) {
                // Have to do this instead of unshift() because of readonly property?
                const convo = conversations.get(other.phone_no)!;
                conversations.set(other.phone_no, {
                    other_user: convo.other_user,
                    messages: [msg, ...convo.messages],
                });
            } else {
                conversations.set(other.phone_no, {
                    other_user: other,
                    messages: [msg],
                });
            }
        });
        console.debug('Loaded', response.data?.length, 'new messages from api');

        // Save all new conversations to redux state
        thunkAPI.dispatch(LOAD_CONVERSATIONS(conversations));

        // Save all conversations to local-storage so we don't reload them unnecessarily from the API
        await Promise.all([
            writeToStorage(`messages-${state.user_data.id}`, JSON.stringify(Array.from(conversations.entries()))),
            writeToStorage(`messages-${state.user_data.id}-last-checked`, String(Date.now())),
        ]);

    } catch (err: any) {
        console.error('Error loading messages:', err);
        Toast.show({
            type: 'error',
            text1: 'Error loading messages',
            text2: err.message ?? err.toString(),
            visibilityTime: 5000,
        });
    } finally {
        thunkAPI.dispatch(SET_REFRESHING(false));
    }
});

export const loadContacts = createDefaultAsyncThunk('loadContacts', async ({ atomic }: { atomic: boolean }, thunkAPI) => {
    try {
        thunkAPI.dispatch(SET_REFRESHING(true));
        let state = thunkAPI.getState().userReducer;

        // Load contacts
        const response = await axios.get(`${API_URL}/getContacts`, axiosBearerConfig(state.token));

        const contacts = await Promise.all(response.data.map(async (contact: any) => {
            try {
                const session_key = await generateSessionKeyECDH(contact.public_key || '', state.keys?.privateKey);
                console.debug('Generated session key for contact:', contact.phone_no);
                return { ...contact, pic: getAvatar(contact.id), session_key };
            } catch (err: any) {
                console.warn('Failed to generate session key:', contact.phone_no, err.message || err);
                return { ...contact, pic: getAvatar(contact.id) };
            }
        }));

        thunkAPI.dispatch(LOAD_CONTACTS(contacts));

    } catch (err: any) {
        console.error('Error loading contacts:', err);
        Toast.show({
            type: 'error',
            text1: 'Error loading contacts',
            text2: err.message ?? err.toString(),
            visibilityTime: 5000,
        });
    } finally {
        if (atomic) { thunkAPI.dispatch(SET_REFRESHING(false)); }
    }
});

export const addContact = createDefaultAsyncThunk('addContact', async ({ user }: { user: UserData }, thunkAPI) => {
    try {
        let state = thunkAPI.getState().userReducer;
        const { data } = await axios.post(`${API_URL}/addContact`, { id: user.id }, axiosBearerConfig(state.token));
        const session_key = await generateSessionKeyECDH(data.public_key || '', state.keys?.privateKey);

        thunkAPI.dispatch(ADD_CONTACT_SUCCESS({ ...data, pic: getAvatar(user.id), session_key }));
        return true;
    } catch (err: any) {
        console.error('Error adding contact:', err);
        Toast.show({
            type: 'error',
            text1: 'Failed to add contact',
            text2: err.message || 'Please try again later',
            visibilityTime: 5000,
        });
        return false;
    }
});

export const searchUsers = createDefaultAsyncThunk<UserData[], { prefix: string }>('searchUsers', async ({ prefix }, thunkAPI) => {
    try {
        thunkAPI.dispatch({ type: 'SET_LOADING', payload: true });
        const state = thunkAPI.getState().userReducer;

        const response = await axios.get(`${API_URL}/searchUsers/${prefix}`, axiosBearerConfig(state.token));

        // Append robot picture to users
        const results = response.data.map((user: any) => (
            { ...user, pic: getAvatar(user.id), isContact: state.contacts.some(contact => contact.id === user.id) }
        ));

        return results;
    } catch (err: any) {
        console.error('Error searching users:', err);
        return [];
    } finally {
        thunkAPI.dispatch({ type: 'SET_LOADING', payload: false });
    }
});

type sendMessageParams = { message: string, to_user: UserData }
export const sendMessage = createDefaultAsyncThunk('sendMessage', async (data: sendMessageParams, thunkAPI) => {
    try {
        thunkAPI.dispatch(SET_LOADING(true));
        const state = thunkAPI.getState().userReducer;

        if (!data.to_user?.session_key) { throw new Error('Missing session_key for ' + data.to_user?.phone_no); }

        // Encrypt and send message
        const encryptedMessage = await encrypt(data.to_user.session_key, data.message);
        await axios.post(`${API_URL}/sendMessage`, { message: encryptedMessage, contact_id: data.to_user.id, contact_phone_no: data.to_user.phone_no }, axiosBearerConfig(state.token));

        // Save message locally
        const localMessage = {
            sender: state.user_data,
            reciever: data.to_user,
            rawMessage: {
                id: Date.now(),
                message: encryptedMessage,
                sender: state.user_data.phone_no,
                sender_id: state.user_data.id,
                reciever: data.to_user.phone_no,
                reciever_id: data.to_user.id,
                sent_at: Date.now().toString(),
                seen: false,
            },
        };
        thunkAPI.dispatch(SEND_MESSAGE(localMessage));
        // Save all conversations to local-storage so we don't reload them unnecessarily from the API
        writeToStorage(`messages-${state.user_data.id}`, JSON.stringify(Array.from(thunkAPI.getState().userReducer.conversations.entries())));
        writeToStorage(`messages-${state.user_data.id}-last-checked`, String(Date.now()));
        return true;
    } catch (err: any) {
        console.error('Error sending message:', err);
        Toast.show({
            type: 'error',
            text1: 'Error sending message',
            text2: err.message ?? err.toString(),
        });
        return false;
    } finally {
        thunkAPI.dispatch(SET_LOADING(false));
    }
});

export const validateToken = createDefaultAsyncThunk('validateToken', async ({ token }: { token: string }, thunkAPI) => {
    try {
        thunkAPI.dispatch(SET_LOADING(true));
        if (!token) { return false; }

        const res = await axios.get(`${API_URL}/validateToken`, axiosBearerConfig(token));

        thunkAPI.dispatch(TOKEN_VALID({ token: token, valid: res.data?.valid }));
        return res.data?.valid;
    } catch (err: any) {
        thunkAPI.dispatch(TOKEN_VALID({ token: '', valid: false }));
        return false;
    } finally {
        thunkAPI.dispatch(SET_LOADING(false));
    }
});

export const syncFromStorage = createDefaultAsyncThunk('syncFromStorage', async (_, thunkAPI) => {
    try {
        thunkAPI.dispatch(SET_LOADING(true));

        console.debug('Loading user from local storage');
        // TODO: Load existing contacts from async storage
        // const token = await readFromStorage('auth_token')
        const user_data = await readFromStorage('user_data');
        if (!user_data) { return false; }

        const payload = {
            user_data: JSON.parse(user_data),
        };
        thunkAPI.dispatch(SYNC_FROM_STORAGE(payload));
        return true;
    } catch (err: any) {
        console.error('Error syncing from storage:', err);
        Toast.show({
            type: 'error',
            text1: 'Failed to sync data from storage',
            text2: err.message ?? err.toString(),
            visibilityTime: 5000,
        });
        return false;
    } finally {
        thunkAPI.dispatch(SET_LOADING(false));
    }
});

export const registerPushNotifications = createDefaultAsyncThunk('registerPushNotifications', async (_, thunkAPI) => {
    try {
        let state = thunkAPI.getState().userReducer;

        console.debug('Registering for Push Notifications');
        const granted = await getPushNotificationPermission();
        if (granted) {
            await registerDeviceForRemoteMessages(getMessaging());
            const token = await getToken(getMessaging());
            await axios.post(`${API_URL}/registerPushNotifications`, { token }, axiosBearerConfig(state.token));
            // Register background handler
            // messaging().setBackgroundMessageHandler(async remoteMessage => {
            //     console.log('Message handled in the background!', remoteMessage);
            // });
        } else {
            console.error('Push notifications permission denied');
        }

    } catch (err: any) {
        console.error('Error Registering for Push Notifications:', err);
        Toast.show({
            type: 'error',
            text1: 'Failed to register for push notifications',
            text2: err.message ?? err.toString(),
            visibilityTime: 5000,
        });
    }
});

function axiosBearerConfig(token: string) {
    return { headers: { 'Authorization': `JWT ${token}` } };
}
