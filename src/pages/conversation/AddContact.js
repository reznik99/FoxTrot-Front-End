import React, { useState, useCallback } from "react"
import { Text, View, ActivityIndicator, ScrollView } from "react-native"
import { Divider, Searchbar } from 'react-native-paper'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faSearch } from '@fortawesome/free-solid-svg-icons'
import { useSelector, useDispatch } from 'react-redux'

import { searchUsers, addContact } from '../../store/actions/user'
import ContactPeek from './../../components/ContactPeek'
import userData from './../../store/userData'
import globalStyle from "../../global/globalStyle"


export default function AddContact(props) {

    const { navigation } = props
    const [results, setresults] = useState("")
    const loading = useSelector(state => state.userReducer.loading)
    const dispatch = useDispatch()

    const handleInput = useCallback(async (newPrefix) => {
        if (newPrefix.length <= 2) return

        // Load data
        const users = await dispatch(searchUsers(newPrefix))

        // Sort results
        setresults(users.sort((u1, u2) => (u1.identifier > u2.identifier) ? 1 : -1))
    })


    return (
        <View style={globalStyle.wrapper}>
            {/* Search */}
            <View style={globalStyle.searchContainer}>
                <Searchbar
                    icon={({ size, color }) => (
                        <FontAwesomeIcon size={size} icon={faSearch} style={{ color: color }} />
                    )}
                    placeholder="Find new contacts"
                    onChangeText={val => handleInput(val)}
                />
            </View>

            {/* Contact List */}
            <ScrollView>
                { /* Contacts */
                    loading
                        ? <ActivityIndicator size="large" color='#fc501c' />
                        : results && results.length > 0
                            ? results.map((user, index) => {
                                return (
                                    <View key={index}>
                                        <ContactPeek data={user} navigation={navigation}
                                            onSelect={async () => {
                                                await dispatch(addContact(user))
                                                navigation.navigate('Conversation', { data: { other_user: user, messages: [] } })
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
    )

}