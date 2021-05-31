import React, { Component } from "react";
import { Text, View, TextInput, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from "react-native";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons'
import ContactPeek from './../../components/ContactPeek';
import userData from './../../store/userData';

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        width: "100%",
        height: "100%",
    }, searchContainer: {
        alignItems: 'center'
    }, input: {
        textAlign: 'center',
        width: '70%',
        margin: 10,
        height: 40,
        borderRadius: 5,
        fontSize: 17,
    }, errorMsg: {
        color: 'red',
        textAlign: 'center',
        fontSize: 20
    }, newContactBtn: {
        alignSelf: 'flex-end',
        padding: 20,
        margin: 20,
        borderRadius: 100,
        backgroundColor: '#00a000',//'#627894',
        shadowColor: "#000",
        elevation: 12,
    }

});

class NewConversation extends Component {
    constructor(props) {
        super(props);

        this.state = {
            prefix: '',
            loading: true,
            results: [],
        }
    }

    componentDidMount() {
        // Should load all contacts from storage
        this.setState({ loading: false })
        // Display all contacts
        this.searchContact(this.state.prefix);
    }

    searchContact = (newPrefix) => {
        newPrefix = newPrefix.toLowerCase()
        // UX
        this.setState({ loading: true, prefix: newPrefix });

        // Load data
        const newResults = [];
        userData.getContacts().forEach((value, key, map) => {
            if (value.identifier?.toLowerCase().startsWith(newPrefix)
                || value.phone_no?.toLowerCase().startsWith(newPrefix)) {
                newResults.push(value);
            }
        });
        //fake delay
        setTimeout(() => this.setState({ loading: false }),
            250
        );

        // Sort results
        this.setState({ results: newResults.sort((r1, r2) => (r1.identifier > r2.identifier) ? 1 : -1) });

    }

    render() {
        const { navigation } = this.props;
        return (
            <View style={styles.wrapper}>
                {/* Search */}
                <View style={styles.searchContainer}>
                    <TextInput placeholder="Search contacts"
                        onChangeText={TextInputValue => this.searchContact(TextInputValue)}
                        underlineColorAndroid='transparent'
                        style={styles.input}
                    />
                </View>

                {/* Contact List */}
                <ScrollView>
                    { /* Contacts */
                        this.state.loading
                            ? <ActivityIndicator size="large" color='#fc501c' />
                            : this.state.results && this.state.results.length > 0
                                ? this.state.results.map((res, index) => {
                                    return <ContactPeek data={res} key={index} navigation={navigation}
                                        onSelect={() => {
                                            // If conversation doesn't exist, create one
                                            let conversation = userData.getOrCreateConversation(res)
                                            navigation.navigate('Conversation', { data: conversation })
                                        }} />
                                })
                                : <Text style={styles.errorMsg}>No results</Text>
                    }

                </ScrollView>

                {/* Add contact */}
                <TouchableOpacity style={styles.newContactBtn} onPress={() => this.props.navigation.navigate('AddContact')}>
                    <FontAwesomeIcon size={25} icon={faUserPlus} style={{ color: '#fff' }} />
                </TouchableOpacity>
            </View>
        );
    }

}

export default NewConversation;