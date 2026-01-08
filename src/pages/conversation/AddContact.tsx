import React, { useEffect, useRef, useState } from 'react';
import { Text, View, ScrollView } from 'react-native';
import { Divider, Searchbar, ActivityIndicator } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { StackScreenProps } from '@react-navigation/stack';

import { searchUsers, addContact } from '~/store/actions/user';
import globalStyle from '~/global/style';
import { RootState, store } from '~/store/store';
import { UserData } from '~/store/reducers/user';
import ContactPeek from '~/components/ContactPeek';
import { HomeStackParamList } from '../../../App';

export default function AddContact(props: StackScreenProps<HomeStackParamList, 'AddContact'>) {

    const { navigation } = props;
    const loading = useSelector<RootState, boolean>(state => state.userReducer.loading);
    const contact_ids = useSelector<RootState, UserData[]>(state => state.userReducer.contacts).map(c => c.id);

    const [results, setResults] = useState<UserData[] | undefined>(undefined);
    const [addingContact, setAddingContact] = useState<UserData | undefined>(undefined);
    const [prefix, setPrefix] = useState('');
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const handleSearch = async () => {
            const users = await store.dispatch(searchUsers({ prefix: prefix })).unwrap();
            setResults(users.sort((u1, u2) => (u1.phone_no > u2.phone_no) ? 1 : -1));
        }
        if (timer.current) { clearTimeout(timer.current); }
        if (prefix.length > 2) { timer.current = setTimeout(handleSearch, 250); }
    }, [prefix]);

    const handleAddContact = async (user: UserData) => {
        setAddingContact(user);
        const success = await store.dispatch(addContact({ user: user })).unwrap();
        if (success) { navigation.replace('Conversation', { data: { peer_user: user } }); }

        setAddingContact(undefined);
    };

    return (
        <View style={globalStyle.wrapper}>
            {/* Search */}
            <View style={globalStyle.searchContainer}>
                <Searchbar icon="magnify"
                    iconColor="#fff"
                    placeholderTextColor="#fff"
                    style={{ color: '#fff', borderRadius: 0 }}
                    placeholder="Find new contacts"
                    onChangeText={val => setPrefix(val)}
                    value={prefix}
                />
            </View>

            {loading &&
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <ActivityIndicator size="large" />
                </View>
            }

            { /* Contact List */}
            {!loading &&
                <ScrollView>
                    {results?.length
                        ? results.map((user, index) => {
                            const isContact = contact_ids.includes(user.id);
                            return (
                                <View key={index}>
                                    <ContactPeek data={user}
                                        loading={addingContact?.phone_no === user.phone_no}
                                        onSelect={() => isContact ? navigation.navigate('Conversation', { data: { peer_user: user } }) : handleAddContact(user)}
                                        isContact={isContact}
                                    />
                                    <Divider />
                                </View>
                            );
                        })
                        : <Text style={[globalStyle.errorMsg, { color: '#fff' }]}>No results</Text>
                    }
                </ScrollView>
            }
        </View>
    );
}
