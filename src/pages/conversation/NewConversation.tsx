import React, { useState, useEffect } from 'react';
import { Text, View, ScrollView } from 'react-native';
import { Searchbar, FAB, ActivityIndicator } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { StackScreenProps } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import globalStyle from '~/global/style';
import { RootState } from '~/store/store';
import { UserData } from '~/store/reducers/user';
import { ACCENT } from '~/global/variables';
import ContactPeek from '~/components/ContactPeek';
import { HomeStackParamList } from '../../../App';

export default function NewConversation(props: StackScreenProps<HomeStackParamList, 'NewConversation'>) {

    const { navigation } = props;
    const contacts = useSelector((state: RootState) => state.userReducer.contacts);
    const [results, setResults] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [prefix, setPrefix] = useState('');
    const insets = useSafeAreaInsets();

    useEffect(() => {
        setLoading(true);

        const newResults = contacts.filter((contact) => contact.phone_no?.toLowerCase().startsWith(prefix.toLowerCase()));
        setResults(newResults.sort((r1, r2) => (r1.phone_no > r2.phone_no) ? 1 : -1));

        setLoading(false);
    }, [prefix, contacts]);

    return (
        <View style={globalStyle.wrapper}>
            {/* Search */}
            <View style={globalStyle.searchContainer}>
                <Searchbar icon="magnify"
                    iconColor="#fff"
                    placeholderTextColor="#fff"
                    style={{ color: '#fff', backgroundColor: ACCENT }}
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
                                data={{ ...contact }}
                                isContact={true}
                                onSelect={() => navigation.navigate('Conversation', { data: { peer_user: contact } })} />;
                        })
                        : <Text style={[globalStyle.errorMsg, { color: '#fff' }]}>No Contacts</Text>
                    }
                </ScrollView>
            }

            <FAB style={[globalStyle.fab, { marginBottom: globalStyle.fab.margin + insets.bottom }]}
                onPress={() => navigation.replace('AddContact')}
                icon="account-plus"
                color="#fff"
            />
        </View>
    );

}
