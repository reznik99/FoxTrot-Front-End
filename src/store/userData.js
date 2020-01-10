
const userData = {
    self: {
        identifier: 'Fraser Geddes',
        pic: 'https://d2gg9evh47fn9z.cloudfront.net/800px_COLOURBOX9531609.jpg',
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
            parties: [party, {identifier: self.identifier, pic: self.pic}],
            messages: []
        });
        userData.callCallbacks();
        return userData.getConversation(party.identifier);
    },
    sendMessage: (identifier, message) => {
        userData.conversations.get(identifier).messages.push( message );
        userData.callCallbacks();
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
    // update
    subscribe: (callback) => {
        userData.callbacks.push(callback);
    },
    callCallbacks: () => {
        for(let callback of userData.callbacks){
            callback();
        }
    }
}

var seconds = Date.now() - 10000000;

// Data should be loaded from database
userData.conversations.set('Terrorist', {
    parties: [{identifier: 'Terrorist', pic: 'https://i.ytimg.com/vi/s7B7KQLi_Z8/maxresdefault.jpg'}, {identifier: self.identifier, pic: self.pic}],
    messages:[
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
    parties: [{identifier: '+69 27 163 22 10', pic: 'https://d2gg9evh47fn9z.cloudfront.net/800px_COLOURBOX9531609.jpg'}, {identifier: self.identifier, pic: self.pic}],
    messages:[
        {
            from: '+994 55 283 97 19',
            content: 'Hello testing message',
            when: seconds
        }, {
            from: 'Fraser Geddes',
            content: 'catch up soon!',
            when: seconds
        },{
            from: '+994 55 283 97 19',
            content: 'Hello testing message',
            when: seconds
        }, {
            from: 'Fraser Geddes',
            content: 'catch up soon!',
            when: seconds
        },{
            from: '+994 55 283 97 19',
            content: 'Hello testing message',
            when: seconds
        }, {
            from: 'Fraser Geddes',
            content: 'catch up soon!',
            when: seconds
        },{
            from: '+994 55 283 97 19',
            content: 'Hello testing message',
            when: seconds
        }, {
            from: 'Fraser Geddes',
            content: 'catch up soon!',
            when: seconds
        },{
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
userData.contacts.set('+69 27 163 22 10', {identifier: '+69 27 163 22 10', pic: 'https://d2gg9evh47fn9z.cloudfront.net/800px_COLOURBOX9531609.jpg'});
userData.contacts.set('Terrorist', {identifier: 'Terrorist', pic: 'https://i.ytimg.com/vi/s7B7KQLi_Z8/maxresdefault.jpg'});
userData.contacts.set('Mom', {identifier: 'Mom', pic: 'https://d2gg9evh47fn9z.cloudfront.net/800px_COLOURBOX9531609.jpg'});
userData.contacts.set('Rufus', {identifier: 'Rufus', pic: 'https://d2gg9evh47fn9z.cloudfront.net/800px_COLOURBOX9531609.jpg'});

export default userData;