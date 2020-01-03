import React, { Component } from 'react';
import {View, ScrollView, StyleSheet, ActivityIndicator, Text, TouchableOpacity} from 'react-native';
import ConversationPeek from '../../components/ConversationPeek';
import { Image } from 'react-native-elements';

import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons'

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        width: "100%",
        height: "100%",
    }, newMessageBtn: {
        alignSelf: 'flex-end',
        padding: 20,
        margin: 20,
        borderRadius: 100,
        backgroundColor: '#627894',
        shadowColor: "#000",
        elevation: 12,
    }
});

export default class Home extends Component {

    constructor(props) {
        super(props);
        this.state = {
            conversations: [
                {
                    parties: [{identifier: 'Terrorist', pic: 'https://i.ytimg.com/vi/s7B7KQLi_Z8/maxresdefault.jpg'}, {identifier: 'Fraser Geddes', pic: 'test'}],
                    messages:[
                        {
                            from: '+994 55 283 97 19',
                            content: 'Wanna hear a joke?',
                            when: ''
                        }, {
                            from: 'Fraser Geddes',
                            content: 'wot',
                            when: ''
                        }, {
                            from: '+994 55 283 97 19',
                            content: 'boom!',
                            when: ''
                        }
                    ]
                }, {
                    parties: [{identifier: '+69 27 163 22 10', pic: 'https://d2gg9evh47fn9z.cloudfront.net/800px_COLOURBOX9531609.jpg'}, {identifier: 'Fraser Geddes', pic: 'test'}],
                    messages:[
                        {
                            from: '+994 55 283 97 19',
                            content: 'Hello testing message',
                            when: ''
                        }, {
                            from: 'Fraser Geddes',
                            content: 'catch up soon!',
                            when: ''
                        },{
                            from: '+994 55 283 97 19',
                            content: 'Hello testing message',
                            when: ''
                        }, {
                            from: 'Fraser Geddes',
                            content: 'catch up soon!',
                            when: ''
                        },{
                            from: '+994 55 283 97 19',
                            content: 'Hello testing message',
                            when: ''
                        }, {
                            from: 'Fraser Geddes',
                            content: 'catch up soon!',
                            when: ''
                        },{
                            from: '+994 55 283 97 19',
                            content: 'Hello testing message',
                            when: ''
                        }, {
                            from: 'Fraser Geddes',
                            content: 'catch up soon!',
                            when: ''
                        },{
                            from: '+994 55 283 97 19',
                            content: 'Hello testing message',
                            when: ''
                        }, {
                            from: 'Fraser Geddes',
                            content: 'catch up soon!',
                            when: ''
                        }, {
                            from: 'Fraser Geddes',
                            content: 'catch up soon!',
                            when: ''
                        }, {
                            from: 'Fraser Geddes',
                            content: 'catch up soon!',
                            when: '14: 02'
                        }
                    ]
                },
            ]
        };
    }

    render() {
        return (
            <View style={styles.wrapper}>
                <ScrollView>
                    {
                        this.state.conversations.map(
                            (convo, index) =>
                                (<ConversationPeek data={convo} key={index} navigation={this.props.navigation}/>)
                        )
                    }
                </ScrollView>
                <TouchableOpacity style={styles.newMessageBtn} onPress={() => this.props.navigation.navigate('NewConversation')}>
                    <FontAwesomeIcon size={25} icon={faEnvelope} style={{color:'#fff'}}/>
                </TouchableOpacity>
            </View>
        );
    }
}

