import React, { Component } from "react"
import { Text, View, ActivityIndicator, ScrollView } from "react-native"
import { Searchbar, FAB } from 'react-native-paper'

import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faUserPlus, faSearch } from '@fortawesome/free-solid-svg-icons'
import ContactPeek from './../../components/ContactPeek'
import userData from './../../store/userData'
import globalStyle from "../../global/globalStyle"


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
            <View style={globalStyle.wrapper}>
                {/* Search */}
                <View style={globalStyle.searchContainer}>
                    <Searchbar
                        icon={({ size, color }) => (
                            <FontAwesomeIcon size={size} icon={faSearch} style={{ color: color }} />
                        )}
                        placeholder="Search contacts"
                        onChangeText={val => this.searchContact(val)}
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
                                : <Text style={globalStyle.errorMsg}>No results</Text>
                    }

                </ScrollView>

                {/* Add contact */}
                <FAB
                    style={globalStyle.fab} color="#fff"
                    onPress={() => this.props.navigation.navigate('AddContact')}
                    icon={({ size, color }) => (
                        <FontAwesomeIcon size={size} icon={faUserPlus} style={{ color: color }} />
                    )}
                />
            </View>
        );
    }

}

export default NewConversation;