import axios from 'axios'
import AsyncStorage from '@react-native-community/async-storage';

const userData = {
    self: {
        phone_no: '',
        JWT: '',
        rsa_keys: {},
        sync_pubKey: false,
    },

    defaultAvatar: 'https://d2gg9evh47fn9z.cloudfront.net/800px_COLOURBOX9531609.jpg',

    conversations: new Map(),
    contacts: new Map(),
    callbacks: [],

    // Conversations
    deleteConversation: (party) => {
        userData.conversations.delete(party.phone_no);
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
    getConversation: (identifier) => {
        return userData.conversations.get(identifier.phone_no);
    },
    getOrCreateConversation: (identifier) => {
        let convo = userData.conversations.has(identifier.phone_no)
        if (!convo) {
            userData.createConversation(identifier)
        }
        return userData.getConversation(identifier)
    },
    getAllConversations: () => {
        return [...userData.conversations.values()];
    },
    // Messages
    sendMessage: async (user, message) => {
        try {
            let msg = {
                message: message,
                sender: userData.self.phone_no,
                reciever: user.phone_no,
                sent_at: Date.now(),
                seen: false
            }
            userData.getConversation(user).messages.push(msg);

            await axios.post('http://francescogorini.com:1234/sendMessage', { message: message, contact_id: user.id }, userData.getConfig())

            userData.callCallbacks();
        }
        catch (error) {
            console.error(`Failed to send message to ${user.phone_no}`)
            console.error(error)
            return "Failed to send message, check your connection!"
        }
    },
    readMessage: (contact) => {
        userData.getConversation(contact).messages.forEach(msg => msg.seen = true)
        userData.callCallbacks()
    },
    getContacts: () => {
        return userData.contacts;
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
    setJWToken: async (token, phone_no) => {
        userData.self.phone_no = phone_no
        await userData.writeToStorage('user', phone_no)
        userData.self.JWT = token
        await userData.writeToStorage('JWT', token)
    },
    setKeys: async (keyPair) => {
        userData.self.sync_pubKey = true
        userData.self.rsa_keys = keyPair
        await userData.writeToStorage('rsa-user-keys', JSON.stringify(keyPair))
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
            // Clean up cached messages
            userData.conversations = new Map()

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
            messages.data = messages.data.sort((msg1, msg2) => {
                let date1 = new Date(msg1.sent_at);
                let date2 = new Date(msg2.sent_at);
                return date1 - date2
            })

            messages.data.forEach(message => {
                let other = message.sender === userData.self.phone_no ? { phone_no: message.reciever, id: message.reciever_id } : { phone_no: message.sender, id: message.sender_id }
                userData.getOrCreateConversation(other).messages.push(message)
            })

            userData.callCallbacks()

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

        console.log('Reading userInfo from local storage into store')
        const phone_no = await AsyncStorage.getItem('user')
        userData.self.phone_no = phone_no;

        if (keys == null) throw new Error('Missing keys in storage. Generate them')
        if (JWT == null) throw new Error('User not authenticated. Re-login')
        if (phone_no == null) throw new Error('Device out of sync. Preform Sync')
    },
    readFromStorage: async (key) => {
        try {
            console.log(`Reading ${key} from local storage into store`)
            return await AsyncStorage.getItem(key)
        } catch (err) {
            console.log(err)
        }
    },
    writeToStorage: async (key, data) => {
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
    isAuthenticated: async () => {
        try {
            // Has user logged in before?
            userData.self.JWT = await userData.readFromStorage('JWT')
            // Is token expired?
            const res = await axios.get('http://francescogorini.com:1234/validateToken', userData.getConfig())
            return res.data.valid

        } catch (err) {
            console.log(err)
            return false
        }
    },

    humanTime: (lastTime) => {
        if (!lastTime) return null

        let now = Date.now()
        let diff = now - new Date(lastTime).valueOf()

        return diff / 1000 > 60
            ? diff / 1000 / 60 > 60
                ? `${parseInt(diff / 1000 / 60 / 60)} h ago`
                : `${parseInt(diff / 1000 / 60)} m ago`
            : 'just now'
    }
}

export default userData;