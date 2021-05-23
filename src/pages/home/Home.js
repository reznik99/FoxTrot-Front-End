import React, { Component } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import ConversationPeek from '../../components/ConversationPeek';

import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons'

import userData from './../../store/userData';

import { RSA } from 'react-native-rsa-native';

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
            conversations: [],
            loading: false,
        };
    }

    async componentDidMount() {
        userData.subscribe(this.reloadConvos);
        this.reloadConvos();

        // Load user private keys or generate them (if first time login) 
        try {
            this.setState({ loading: true, loading_msg: "Loading cryptographic keys" })

            const keys = await AsyncStorage.getItem('rsa-user-keys')
            console.log("Loaded rsa-keys from storage")
            userData.self.rsa_keys = JSON.parse(keys)

        } catch (e) {
            this.setState({ loading: true, loading_msg: "Generating cryptographic keys" })
            console.log("Generating rsa-keys")

            const keys = await RSA.generateKeys(4096)
            console.log('4096 public:', keys.public);
            userData.self.rsa_keys = { privateKey: keys.private, publicKey: keys.public }
            await AsyncStorage.setItem('rsa-user-keys', JSON.stringify(userData.self.rsa_keys))

        } finally {
            this.setState({ loading: false, loading_msg: "" })
        }
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
                {
                    this.state.loading
                        ? <> <Text>{this.state.loading_msg}</Text>
                            <ActivityIndicator color="#00FFFF" />
                        </>
                        : <>
                            <ScrollView>
                                {
                                    this.state.conversations.length > 0
                                        ? this.state.conversations.map(
                                            (convo, index) =>
                                                (<ConversationPeek data={convo} key={index} navigation={this.props.navigation} />)
                                        )
                                        : <Text>No Conversations.</Text>
                                }
                            </ScrollView>
                            <TouchableOpacity style={styles.newMessageBtn} onPress={() => this.props.navigation.navigate('NewConversation')}>
                                <FontAwesomeIcon size={25} icon={faEnvelope} style={{ color: '#fff' }} />
                            </TouchableOpacity>
                        </>
                }
            </View>
        );
    }
}

