import React, { Component } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import ConversationPeek from '../../components/ConversationPeek';

import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons'

import userData from './../../store/userData';

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
            conversations: []
        };
    }

    componentDidMount() {
        userData.subscribe(this.reloadConvos);
        this.reloadConvos();
    }

    reloadConvos = () => {
        const convos = []
        userData.getAllConversations().forEach((value, key, map) => {
            convos.push(value);
        });
        this.setState({
            conversations: convos.sort((c1, c2) => {
                if (c1.messages.length <= 0)
                    return -1;
                if (c2.messages.length <= 0)
                    return 1;

                return c1.messages[c1.messages.length - 1].when < c2.messages[c2.messages.length - 1].when ? 1 : -1
            })
        });
    }

    render() {
        return (
            <View style={styles.wrapper}>
                <ScrollView>
                    {
                        this.state.conversations.length > 0
                            ? this.state.conversations.map(
                                (convo, index) =>
                                    (<ConversationPeek data={convo} key={index} navigation={this.props.navigation} />)
                            )
                            : <ActivityIndicator color="#00FFFF" />
                    }
                </ScrollView>
                <TouchableOpacity style={styles.newMessageBtn} onPress={() => this.props.navigation.navigate('NewConversation')}>
                    <FontAwesomeIcon size={25} icon={faEnvelope} style={{ color: '#fff' }} />
                </TouchableOpacity>
            </View>
        );
    }
}

