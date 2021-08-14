import React, { useState, useEffect, useCallback } from "react"
import { Text, View, ActivityIndicator, ScrollView } from "react-native"
import { Searchbar, FAB } from 'react-native-paper'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faUserPlus, faSearch } from '@fortawesome/free-solid-svg-icons'
import { useSelector } from 'react-redux'

import { ContactPeek } from './../../components'
import globalStyle from "../../global/globalStyle"


export default function NewConversation(props) {

    const { navigation } = props
    const { contacts, conversations } = useSelector(state => state.userReducer)
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState([])

    useEffect(() => {
        searchContact('')
    }, [])

    const searchContact = useCallback((newPrefix) => {
        setLoading(true)
        // UX
        newPrefix = newPrefix.toLowerCase()

        // Load data
        const newResults = [];
        contacts.forEach((value, key, map) => {
            if (value.identifier?.toLowerCase().startsWith(newPrefix)
                || value.phone_no?.toLowerCase().startsWith(newPrefix)) {
                newResults.push(value);
            }
        });

        // Sort results
        setResults(newResults.sort((r1, r2) => (r1.identifier > r2.identifier) ? 1 : -1))

        //fake delay
        setTimeout(() => setLoading(false),
            250
        );
    }, [contacts])

    return (
        <View style={globalStyle.wrapper}>
            {/* Search */}
            <View style={globalStyle.searchContainer}>
                <Searchbar
                    icon={({ size, color }) => (
                        <FontAwesomeIcon size={size} icon={faSearch} style={{ color: color }} />
                    )}
                    placeholder="Search contacts"
                    onChangeText={val => searchContact(val)}
                />
            </View>

            {/* Contact List */}
            <ScrollView>
                { /* Contacts */
                    loading
                        ? <ActivityIndicator size="large" color='#fc501c' />
                        : results && results.length > 0
                            ? results.map((contact, index) => {
                                return <ContactPeek data={contact} key={index} navigation={navigation}
                                    onSelect={() => {
                                        // Pass existing conversation data to new page, or create empty conversation if a new chat
                                        let conversation = conversations.find(convo => convo.other_user.phone_no === contact.phone_no)
                                        if (!conversation) conversation = { other_user: contact, messages: [] }
                                        navigation.navigate('Conversation', { data: conversation })
                                    }} />
                            })
                            : <Text style={globalStyle.errorMsg}>No results</Text>
                }

            </ScrollView>

            {/* Add contact */}
            <FAB
                style={globalStyle.fab} color="#fff"
                onPress={() => navigation.navigate('AddContact')}
                icon={({ size, color }) => (
                    <FontAwesomeIcon size={size} icon={faUserPlus} style={{ color: color }} />
                )}
            />
        </View>
    )

}