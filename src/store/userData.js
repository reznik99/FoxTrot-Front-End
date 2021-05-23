import axios from 'axios'
import AsyncStorage from '@react-native-community/async-storage';

const userData = {
    self: {
        identifier: 'Fraser Geddes',
        pic: 'https://d2gg9evh47fn9z.cloudfront.net/800px_COLOURBOX9531609.jpg',
        rsa_keys: {},
        JWT: "",
    },

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
    // getters
    getConversation: (identifier) => {
        return userData.conversations.get(identifier);
    },
    getAllConversations: () => {
        return userData.conversations;
    },
    getContacts: () => {
        return userData.contacts;
    },
    searchUsers: async (prefix) => {
        try {
            const users = await axios.get(`http://francescogorini.com:1234/searchUsers/?prefix=${prefix}`, userData.getConfig())
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
    },
    getConfig: () => {
        // Send JWT Token to authorize requests
        return { headers: { "Authorization": `JWT ${userData.self.JWT}` } }
    }
}

var seconds = Date.now() - 10000000;

// Data should be loaded from database
userData.conversations.set('Terrorist', {
    parties: [{ identifier: 'Terrorist', pic: 'https://i.ytimg.com/vi/s7B7KQLi_Z8/maxresdefault.jpg' }, { identifier: self.identifier, pic: self.pic }],
    messages: [
        {
            from: '+994 55 283 97 19',
            content: 'Wanna hear a joke?',
            when: seconds
        }, {
            from: 'Fraser Geddes',
            content: 'wot',
            when: seconds
        }, {
            from: '+994 55 283 97 19',
            content: 'boom!',
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
            from: 'Fraser Geddes',
            content: 'catch up soon!',
            when: seconds
        }, {
            from: '+994 55 283 97 19',
            content: 'Hello testing message',
            when: seconds
        }, {
            from: 'Fraser Geddes',
            content: 'catch up soon!',
            when: seconds
        }, {
            from: '+994 55 283 97 19',
            content: 'Hello testing message',
            when: seconds
        }, {
            from: 'Fraser Geddes',
            content: 'catch up soon!',
            when: seconds
        }, {
            from: '+994 55 283 97 19',
            content: 'Hello testing message',
            when: seconds
        }, {
            from: 'Fraser Geddes',
            content: 'catch up soon!',
            when: seconds
        }, {
            from: '+994 55 283 97 19',
            content: 'Hello testing message',
            when: seconds
        }, {
            from: 'Fraser Geddes',
            content: 'catch up soon!',
            when: seconds
        }, {
            from: 'Fraser Geddes',
            content: 'catch up soon!',
            when: seconds
        }, {
            from: 'Fraser Geddes',
            content: 'catch up soon!',
            when: seconds
        }
    ]
});
userData.contacts.set('+69 27 163 22 10', { identifier: '+69 27 163 22 10', pic: 'https://d2gg9evh47fn9z.cloudfront.net/800px_COLOURBOX9531609.jpg' });
userData.contacts.set('Terrorist', { identifier: 'Terrorist', pic: 'https://i.ytimg.com/vi/s7B7KQLi_Z8/maxresdefault.jpg' });
userData.contacts.set('Mom', { identifier: 'Mom', pic: 'https://d2gg9evh47fn9z.cloudfront.net/800px_COLOURBOX9531609.jpg' });
userData.contacts.set('Rufus', { identifier: 'Rufus', pic: 'https://d2gg9evh47fn9z.cloudfront.net/800px_COLOURBOX9531609.jpg' });

export default userData;