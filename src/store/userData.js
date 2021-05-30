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
        userData.conversations.set(party.identifier, {
            parties: [party, self],
            messages: []
        });
        userData.callCallbacks();
        return userData.getConversation(party.identifier);
    },
    sendMessage: (identifier, message) => {
        userData.conversations.get(identifier).messages.push(message);
        userData.callCallbacks();
    },
    addContact: async (contact) => {
        try {
            userData.contacts.set(contact.nickname || contact.phone_no, contact)
            await axios.post('http://francescogorini.com:1234/addContact', contact, userData.getConfig())
        }
        catch (error) {
            userData.contacts.delete(contact.nickname || contact.phone_no)
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

var seconds = Date.now() - 10000000;

// Data should be loaded from database
userData.conversations.set('Mr Bean', {
    parties: [{ identifier: 'Mr Bean', pic: 'https://i.ytimg.com/vi/s7B7KQLi_Z8/maxresdefault.jpg' }, { identifier: self.identifier, pic: self.pic }],
    messages: [
        {
            from: '+994 55 283 97 19',
            content: 'Wanna hear a joke?',
            when: seconds
        }, {
            from: 'Francesco',
            content: 'Hi my name is Grant',
            when: seconds
        }, {
            from: '+994 55 283 97 19',
            content: 'meet at starbuck Dixon at 6:45?',
            when: seconds
        }
    ]
});
userData.conversations.set('+69 27 163 22 10', {
    parties: [{ identifier: '+69 27 163 22 10', pic: 'https://d2gg9evh47fn9z.cloudfront.net/800px_COLOURBOX9531609.jpg' }, { identifier: self.identifier, pic: self.pic }],
    messages: [
        {
            from: '+994 55 283 97 19',
            content: 'Hello testing message',
            when: seconds
        }, {
            from: 'Francesco',
            content: 'catch up soon!',
            when: seconds
        }, {
            from: '+994 55 283 97 19',
            content: 'Hello testing message',
            when: seconds
        }, {
            from: 'Francesco',
            content: 'catch up soon!',
            when: seconds
        }, {
            from: '+994 55 283 97 19',
            content: 'Hello testing message',
            when: seconds
        }, {
            from: 'Francesco',
            content: 'catch up soon!',
            when: seconds
        }, {
            from: '+994 55 283 97 19',
            content: 'Hello testing message',
            when: seconds
        }, {
            from: 'Francesco',
            content: 'catch up soon!',
            when: seconds
        }, {
            from: '+994 55 283 97 19',
            content: 'Hello testing message',
            when: seconds
        }, {
            from: 'Francesco',
            content: 'catch up soon!',
            when: seconds
        }, {
            from: 'Francesco',
            content: 'catch up soon!',
            when: seconds
        }, {
            from: 'Francesco',
            content: 'catch up soon!',
            when: seconds
        }
    ]
});
userData.contacts.set('+69 27 163 22 10', { identifier: '+69 27 163 22 10', pic: 'https://d2gg9evh47fn9z.cloudfront.net/800px_COLOURBOX9531609.jpg' });
userData.contacts.set('Mr Bean', { identifier: 'Mr Bean', pic: 'https://i.ytimg.com/vi/s7B7KQLi_Z8/maxresdefault.jpg' });
userData.contacts.set('Mom', { identifier: 'Mom', pic: 'https://d2gg9evh47fn9z.cloudfront.net/800px_COLOURBOX9531609.jpg' });
userData.contacts.set('Rufus', { identifier: 'Rufus', pic: 'https://d2gg9evh47fn9z.cloudfront.net/800px_COLOURBOX9531609.jpg' });

export default userData;