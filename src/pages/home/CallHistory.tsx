import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, RefreshControl, Text, Alert } from 'react-native';
import { Divider, Button, Icon } from 'react-native-paper';
import { StackScreenProps } from '@react-navigation/stack';

import CallHistoryItem from '~/components/CallHistoryItem';
import { dbGetCallHistory, dbClearCallHistory } from '~/global/database';
import { CallRecord } from '~/store/reducers/user';
import { SECONDARY_LITE } from '~/global/variables';
import globalStyle from '~/global/style';
import { HomeStackParamList } from '~/../App';

type IProps = StackScreenProps<HomeStackParamList, 'CallHistory'>;

export default function CallHistory(props: IProps) {
    const [records, setRecords] = useState<CallRecord[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadHistory = useCallback(() => {
        try {
            const history = dbGetCallHistory();
            setRecords(history);
        } catch (err) {
            console.error('Failed to load call history:', err);
        }
    }, []);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadHistory();
        setRefreshing(false);
    }, [loadHistory]);

    const onClearHistory = useCallback(() => {
        Alert.alert('Clear Call History', 'Are you sure you want to delete all call records?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Clear',
                style: 'destructive',
                onPress: () => {
                    try {
                        dbClearCallHistory();
                        setRecords([]);
                    } catch (err) {
                        console.error('Failed to clear call history:', err);
                    }
                },
            },
        ]);
    }, []);

    return (
        <View style={globalStyle.wrapper}>
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {records.length > 0 ? (
                    <>
                        {records.map((record, index) => (
                            <View key={record.id ?? index}>
                                <CallHistoryItem record={record} navigation={props.navigation} />
                                <Divider />
                            </View>
                        ))}
                        <Button
                            mode="text"
                            textColor="#e53935"
                            onPress={onClearHistory}
                            style={{ marginVertical: 20 }}
                        >
                            Clear Call History
                        </Button>
                    </>
                ) : (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 }}>
                        <Icon source="phone-off" size={48} color={SECONDARY_LITE} />
                        <Text style={[globalStyle.errorMsg, { color: '#fff' }]}>No calls yet.</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
