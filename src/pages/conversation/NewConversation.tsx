import React, { useState, useEffect, useCallback } from 'react';
import { Text, View, ScrollView } from 'react-native';
import { Searchbar, FAB, ActivityIndicator, Icon } from 'react-native-paper';
import { useSelector } from 'react-redux';

import globalStyle from '~/global/style';
import { RootState } from '~/store/store';
import { UserData } from '~/store/reducers/user';
import { ACCENT } from '~/global/variables';
import ContactPeek from '~/components/ContactPeek';

export default function NewConversation(props: { navigation: any }) {

    const { navigation } = props;
    const contacts = useSelector((state: RootState) => state.userReducer.contacts);
    const [results, setResults] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [prefix, setPrefix] = useState('');

    useEffect(() => {
        setLoading(true);

        const newResults = contacts.filter((contact) => contact.phone_no?.toLowerCase().startsWith(prefix.toLowerCase()));
        setResults(newResults.sort((r1, r2) => (r1.phone_no > r2.phone_no) ? 1 : -1));

        setLoading(false);
    }, [prefix]);

    return (
        <View style={globalStyle.wrapper}>
            {/* Search */}
            <View style={globalStyle.searchContainer}>
                <Searchbar
                    icon={({ size, color }) => (
                        <Icon source="magnify" color={color} size={size}/>
                    )}
                    iconColor="white"
                    placeholderTextColor="white"
                    style={{ color: 'white', backgroundColor: ACCENT }}
                    placeholder="Search contacts"
                    value={prefix}
                    onChangeText={val => setPrefix(val)}
                />
            </View>

            {loading && <ActivityIndicator size="large" />}

            {!loading &&
                <ScrollView>
                    {results?.length
                        ? results.map((contact, index) => {
                            return <ContactPeek key={index}
                                navigation={navigation}
                                data={{ ...contact }}
                                isContact={true}
                                onSelect={() => navigation.navigate('Conversation', { data: { peer_user: contact } })} />;
                        })
                        : <Text style={[globalStyle.errorMsg, { color: '#fff' }]}>No Contacts</Text>
                    }
                </ScrollView>
            }

            <FAB
                style={globalStyle.fab} color="#fff"
                onPress={() => navigation.replace('AddContact')}
                icon={({ size, color }) => (
                    <Icon source="account-plus" color={color} size={size}/>
                )}
            />
        </View>
    );

}
