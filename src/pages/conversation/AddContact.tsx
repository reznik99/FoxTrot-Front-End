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
    const loading = useSelector((state: RootState) => state.userReducer.loading);
    const dispatch = useDispatch<AppDispatch>();

    const [results, setResults] = useState<UserData[] | undefined>(undefined);
    const [addingContact, setAddingContact] = useState<UserData | undefined>(undefined);
    const [prefix, setPrefix] = useState('');
    const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

    const handleSearch = async () => {
        const users: UserData[] = await dispatch(searchUsers({ prefix: prefix })) as any;
        setResults(users.sort((u1, u2) => (u1.phone_no > u2.phone_no) ? 1 : -1));
    };

    useEffect(() => {
        if (timer) { clearTimeout(timer); }
        if (prefix.length > 2) { setTimer(setTimeout(handleSearch, 250)); }
    }, [prefix, timer]);

    const handleAddContact = async (user: UserData) => {
        setAddingContact(user);
        const success = await dispatch(addContact({ user: user }));
        if (success) { navigation.replace('Conversation', { data: { peer_user: user } }); }

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
                            );
                        })
                        : <Text style={[globalStyle.errorMsg, { color: '#fff' }]}>No results</Text>
                    }
                </ScrollView>
            }
        </View>
    );
}
