import React, { Component } from "react"
import { Text, View, TextInput, StyleSheet, ActivityIndicator, ScrollView } from "react-native"
import { Divider, Searchbar } from 'react-native-paper'

import ContactPeek from './../../components/ContactPeek'
import userData from './../../store/userData'
import globalStyle from "../../global/globalStyle"

const styles = StyleSheet.create({

});

class AddContact extends Component {
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
    }

    searchUsers = async (newPrefix) => {
        // UX
        this.setState({ loading: true, prefix: newPrefix });
        if (newPrefix.length <= 2) return

        // Load data
        const newResults = await userData.searchUsers(newPrefix)

        // Sort results
        this.setState({ results: newResults.sort((r1, r2) => (r1.identifier > r2.identifier) ? 1 : -1), loading: false })
    }

    render() {
        const { navigation } = this.props;
        return (
            <View style={globalStyle.wrapper}>
                {/* Search */}
                <View style={globalStyle.searchContainer}>
                    <Searchbar
                        placeholder="Find new contacts"
                        value={this.state.prefix}
                        onChangeText={val => this.searchUsers(val)}
                    />
                </View>

                {/* Contact List */}
                <ScrollView>
                    { /* Contacts */
                        this.state.loading
                            ? <ActivityIndicator size="large" color='#fc501c' />
                            : this.state.results && this.state.results.length > 0
                                ? this.state.results.map((res, index) => {
                                    return (
                                        <View key={index}>
                                            <ContactPeek data={res} navigation={navigation}
                                                onSelect={async () => {
                                                    await userData.addContact(res)
                                                    navigation.navigate('Conversation', { data: userData.createConversation(res) })
                                                }}
                                            />
                                            <Divider />
                                        </View>
                                    )
                                })
                                : <Text style={globalStyle.errorMsg}>No results</Text>
                    }
                </ScrollView>
            </View>
        );
    }

}

export default AddContact;