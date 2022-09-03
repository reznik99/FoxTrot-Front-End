import React, { useState, useCallback, useEffect } from "react"
import { Text, View, ScrollView } from "react-native"
import { Divider, Searchbar, Snackbar, ActivityIndicator } from 'react-native-paper'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faSearch } from '@fortawesome/free-solid-svg-icons'
import { useSelector, useDispatch } from 'react-redux'

import { searchUsers, addContact, clearAddingContact } from '../../store/actions/user'
import { ContactPeek } from './../../components/'
import globalStyle from "~/global/globalStyle"


export default function AddContact(props) {

    const { navigation } = props
    const [snackMsg, setSnackMsg] = useState("")
    const [visibleSnack, setVisibleSnack] = useState(false)
    const [results, setResults] = useState("")
    const { loading, adding_contact, failed_contact, new_contact } = useSelector(state => state.userReducer)
    const dispatch = useDispatch()


    useEffect(() => {
        if (!new_contact) return
        showSnack("Contact added successfully")
        navigation.navigate('Conversation', { data: { other_user: new_contact, messages: [] } })
    }, [new_contact])

    useEffect(() => {
        if (!failed_contact) return
        showSnack("Failed to add contact! Try again later")
        dispatch(clearAddingContact())
    }, [failed_contact])

    const handleInput = useCallback(async (newPrefix) => {
        if (newPrefix.length <= 2) return

        // Load data
        const users = await dispatch(searchUsers(newPrefix))

        // Sort results
        setResults(users.sort((u1, u2) => (u1.identifier > u2.identifier) ? 1 : -1))
    })

    const showSnack = useCallback((msg) => {
        setSnackMsg(msg)
        setVisibleSnack(true)
        setTimeout(dismissSnack, 4000);
    })

    const dismissSnack = useCallback((msg) => {
        setVisibleSnack(false)
        setSnackMsg("")
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

            { /* Contact List */
                loading
                    ? <View style={{ flex: 1, justifyContent: 'center' }}>
                        <ActivityIndicator size="large" />
                    </View>
                    : <ScrollView>
                        { results?.length
                            ? results.map((user, index) => {
                                return (
                                    <View key={index}>
                                        <ContactPeek data={user} navigation={navigation} loading={adding_contact?.phone_no === user.phone_no}
                                            onSelect={() => dispatch(addContact(user))}
                                        />
                                        <Divider />
                                    </View>
                                )
                            })
                            : <Text style={[globalStyle.errorMsg, {color: '#fff'}]}>No results</Text>
                        }
                    </ScrollView>
            }

            {/* Snack bar */}
            <Snackbar visible={visibleSnack}
                onDismiss={dismissSnack}
                action={{
                    label: 'Dismiss',
                    onPress: () => { },
                }}> {snackMsg}
            </Snackbar>
        </View>
    )

}