import axios from 'axios'
import AsyncStorage from '@react-native-community/async-storage';

const userData = {
    self: {
        identifier: 'Francesco',
        pic: 'https://d2gg9evh47fn9z.cloudfront.net/800px_COLOURBOX9531609.jpg',
        rsa_keys: {},
        sync_pubKey: false,
        JWT: "",
    },

    defaultAvatar: 'https://d2gg9evh47fn9z.cloudfront.net/800px_COLOURBOX9531609.jpg',

    conversations: new Map(),
    contacts: new Map(),
    callbacks: [],

    // Setters
    deleteConversation: (party) => {
        userData.conversations.delete(party.identifier);
        userData.callCallbacks();
    },
    createConversation: (party) => {
        userData.conversations.set(party.phone_no, {
            parties: [party, self],
            messages: []
        });
        userData.callCallbacks();
        return userData.getConversation(party.phone_no);
    },
    sendMessage: async (user, message) => {
        try {
            let msg = {
                content: message,
                from: userData.self.identifier,
                to: user.phone_no,
                sent_at: Date.now(),
                seen: false
            }
            userData.getConversation(user.phone_no).messages.push(msg);

            await axios.post('http://francescogorini.com:1234/sendMessage', { message: message, contact_id: user.id }, userData.getConfig())

            userData.callCallbacks();
        }
        catch (error) {
            console.error(`Failed to send message to ${user.phone_no}`)
            console.error(error)
            return "Failed to send message, check your connection!"
        }
    },
    addContact: async (contact) => {
        try {
            await axios.post('http://francescogorini.com:1234/addContact', { id: contact.id }, userData.getConfig())
            userData.contacts.set(contact.nickname || contact.phone_no, contact)
        }
        catch (error) {
            console.error(`Failed to add contact ${contact.phone_no}`)
            return "Failed to add contact, check your connection!"
        }
    },
    setJWToken: async (token) => {
        userData.self.JWT = token
        await userData.writeDataToStorage('JWT', token)
    },
    setKeys: async (keyPair) => {
        userData.self.sync_pubKey = true
        userData.self.rsa_keys = keyPair
        await userData.writeDataToStorage('rsa-user-keys', JSON.stringify(keyPair))
    },
    // getters
    getConversation: (identifier) => {
        return userData.conversations.get(identifier);
    },
    getOrCreateConversation: (identifier) => {
        let convo = userData.conversations.has(identifier.phone_no)
        if (!convo) {
            userData.createConversation(identifier)
        }
        return userData.getConversation(identifier.phone_no)
    },
    getAllConversations: () => {
        return [...userData.conversations.values()];
    },
    getContacts: () => {
        return userData.contacts;
    },
    searchUsers: async (prefix) => {
        try {
            const users = await axios.get(`http://francescogorini.com:1234/searchUsers/${prefix}`, userData.getConfig())
            return users.data || []
        } catch (error) {
            console.error(error)
            return []
        }
    },
    // update
    subscribe: (callback) => {
        userData.callbacks.push(callback);
    },
    unsubscribe: (callback) => {
        userData.callbacks.splice(callback);
    },
    callCallbacks: () => {
        userData.callbacks.forEach(callback => callback());
    },
    preformSync: async () => {
        try {
            // Upload user public key
            if (userData.self.sync_pubKey) {
                userData.self.sync_pubKey = false
                await axios.post('http://francescogorini.com:1234/savePublicKey', { publicKey: userData.self.rsa_keys.publicKey }, userData.getConfig())
            }
            // Load user contacts
            const contacts = await axios.get('http://francescogorini.com:1234/getContacts', userData.getConfig())

            contacts.data.forEach(contact => {
                userData.contacts.set(contact.nickname || contact.phone_no, contact)
            });

            // Load user conversations
            const messages = await axios.get('http://francescogorini.com:1234/getConversations', userData.getConfig())

            messages.data.forEach(message => {
                userData.getOrCreateConversation({ phone_no: message.phone_no, id: message.contact_id }).messages.push({
                    content: message.message,
                    from: userData.self.identifier,
                    to: message.phone_no,
                    when: message.sent_at,
                    seen: message.seen
                });
            })

        } catch (error) {
            console.error(error)
        }
    },
    readStateFromStorage: async () => {
        console.log('Reading keys from local storage into store')
        const keys = await AsyncStorage.getItem('rsa-user-keys')
        userData.self.rsa_keys = JSON.parse(keys);

        console.log('Reading JWT from local storage into store')
        const JWT = await AsyncStorage.getItem('JWT')
        userData.self.JWT = JWT;

        if (keys == null || JWT == null) throw new Error('Missing creds in storage. Generate them')
    },
    writeDataToStorage: async (key, data) => {
        try {
            await AsyncStorage.setItem(key, data)
        } catch (err) {
            console.log(err)
        }
    },
    deleteFromStorage: async (key) => {
        try {
            await AsyncStorage.removeItem(key)
        } catch (err) {
            console.log(err)
        }
    },
    getConfig: () => {
        // Send JWT Token to authorize requests
        return { headers: { "Authorization": `JWT ${userData.self.JWT}` } }
    },

    humanTime: (lastTime) => {
        let time = Date.now()
        let diff = time - parseInt(lastTime)
        return diff / 1000 > 60
            ? diff / 1000 / 60 > 60
                ? `${parseInt(diff / 1000 / 60 / 60)} h ago`
                : `${parseInt(diff / 1000 / 60)} m ago`
            : 'just now'
    }
}

export default userData;