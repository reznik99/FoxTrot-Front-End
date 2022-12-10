import React, { useState } from "react"
import { Text, View, ScrollView } from "react-native"
import { Divider, Searchbar, ActivityIndicator } from 'react-native-paper'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faSearch } from '@fortawesome/free-solid-svg-icons'
import { useSelector, useDispatch } from 'react-redux'
import Toast from 'react-native-toast-message'

import { searchUsers, addContact } from '../../store/actions/user'
import { ContactPeek } from './../../components/'
import globalStyle from "~/global/globalStyle"


export default function AddContact(props) {

    const { navigation } = props
    const [results, setResults] = useState("")
    const [addingContact, setAddingContact] = useState(undefined)
    const { loading } = useSelector(state => state.userReducer)
    const dispatch = useDispatch()

    const handleInput = async (newPrefix) => {
        if (newPrefix.length <= 2) return

        // Load data
        const users = await dispatch(searchUsers(newPrefix))

        // Sort results
        setResults(users.sort((u1, u2) => (u1.identifier > u2.identifier) ? 1 : -1))
    }

    const handleAddContact = async (user) => {
        setAddingContact(user)
        const success = await dispatch(addContact(user))
        if (success) navigation.replace('Conversation', { data: { peer_user: user } })
        else {
            Toast.show({
                type: 'error',
                text1: 'Failed to add contact',
                text2: 'Please try again later',
                visibilityTime: 5000
              });
        }
        setAddingContact(undefined)
    }


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
            
            { loading && 
                <View style={{ flex: 1, justifyContent: 'center' }}> 
                    <ActivityIndicator size="large" />
                </View>
            }

            { /* Contact List */ }
            { !loading && 
                <ScrollView>
                    { results?.length
                        ? results.map((user, index) => {
                            return (
                                <View key={index}>
                                    <ContactPeek data={user} navigation={navigation} loading={addingContact?.phone_no === user.phone_no}
                                        onSelect={() => handleAddContact(user)}
                                    />
                                    <Divider />
                                </View>
                            )
                        })
                        : <Text style={[globalStyle.errorMsg, {color: '#fff'}]}>No results</Text>
                    }
                </ScrollView>
            }
        </View>
    )
}