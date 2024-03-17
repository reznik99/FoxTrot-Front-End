import React, { useEffect, useState } from "react"
import { Text, View, ScrollView } from "react-native"
import { Divider, Searchbar, ActivityIndicator } from 'react-native-paper'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faSearch } from '@fortawesome/free-solid-svg-icons'
import { useSelector, useDispatch } from 'react-redux'
import { ThunkDispatch } from "redux-thunk"
import { AnyAction } from "redux";

import { searchUsers, addContact } from '~/store/actions/user'
import globalStyle from "~/global/style"
import { RootState } from "~/store/store"
import { UserData } from "~/store/reducers/user"
import ContactPeek from "~/components/ContactPeek"

type AppDispatch = ThunkDispatch<any, any, AnyAction>

export default function AddContact(props: { navigation: any }) {

    const { navigation } = props
    const loading = useSelector((state: RootState) => state.userReducer.loading)
    const dispatch = useDispatch<AppDispatch>()

    const [results, setResults] = useState<UserData[] | undefined>(undefined)
    const [addingContact, setAddingContact] = useState<UserData | undefined>(undefined)
    const [prefix, setPrefix] = useState("")
    const [timer, setTimer] = useState(-1)


    useEffect(() => {
        if(timer) clearTimeout(timer)
        if (prefix.length > 2) setTimer(setTimeout(handleSearch, 250))
    }, [prefix])

    const handleSearch = async () => {
        const users: UserData[] = await dispatch(searchUsers(prefix)) as any
        setResults(users.sort((u1, u2) => (u1.phone_no > u2.phone_no) ? 1 : -1))
    }

    const handleAddContact = async (user: UserData) => {
        setAddingContact(user)
        const success = await dispatch(addContact(user))
        if (Boolean(success)) navigation.replace('Conversation', { data: { peer_user: user } })

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
                    onChangeText={val => setPrefix(val)}
                    value={prefix}
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
                                    <ContactPeek 
                                        data={user} 
                                        navigation={navigation} 
                                        loading={addingContact?.phone_no === user.phone_no}
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