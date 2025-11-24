import React, { useEffect, useState } from 'react';
import { Text, View, ScrollView } from 'react-native';
import { Divider, Searchbar, ActivityIndicator, Icon } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { StackScreenProps } from '@react-navigation/stack';

import { searchUsers, addContact } from '~/store/actions/user';
import globalStyle from '~/global/style';
import { AppDispatch, RootState } from '~/store/store';
import { UserData } from '~/store/reducers/user';
import ContactPeek from '~/components/ContactPeek';
import { HomeStackParamList } from '../../../App';

export default function AddContact(props: StackScreenProps<HomeStackParamList, 'AddContact'>) {

    const { navigation } = props;
    const loading = useSelector<RootState, boolean>(state => state.userReducer.loading);
    const contact_ids = useSelector<RootState, UserData[]>(state => state.userReducer.contacts).map(c => c.id);
    const dispatch = useDispatch<AppDispatch>();

    const [results, setResults] = useState<UserData[] | undefined>(undefined);
    const [addingContact, setAddingContact] = useState<UserData | undefined>(undefined);
    const [prefix, setPrefix] = useState('');
    const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

    const handleSearch = async () => {
        const res = await dispatch(searchUsers({ prefix: prefix }));
        const users = res.payload as UserData[];
        setResults(users.sort((u1, u2) => (u1.phone_no > u2.phone_no) ? 1 : -1));
    };

    useEffect(() => {
        if (timer) { clearTimeout(timer); }
        if (prefix.length > 2) { setTimer(setTimeout(handleSearch, 250)); }
    }, [prefix]);

    const handleAddContact = async (user: UserData) => {
        setAddingContact(user);
        const res = await dispatch(addContact({ user: user }));
        if (res.payload) { navigation.replace('Conversation', { data: { peer_user: user } }); }

        setAddingContact(undefined);
    };

    const renderSearchIcon = ({ size, color }: { size: number, color: string }) => {
        return <Icon source="magnify" color={color} size={size} />;
    };

    return (
        <View style={globalStyle.wrapper}>
            {/* Search */}
            <View style={globalStyle.searchContainer}>
                <Searchbar
                    icon={renderSearchIcon}
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
