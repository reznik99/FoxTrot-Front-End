/**
 * Database migration tests using sql.js in-memory database.
 * Tests that data migrated from AsyncStorage format is identical when queried back.
 */
import initSqlJs, { Database } from 'sql.js';
import { Conversation, message, UserData } from '~/store/reducers/user';

// Adapter to make sql.js match op-sqlite's executeSync API
function createOpSqliteAdapter(sqlJsDb: Database) {
    return {
        executeSync: (sql: string, params: any[] = []) => {
            const results = sqlJsDb.exec(sql, params);
            if (results.length === 0) {
                return { rows: [] };
            }
            // Convert sql.js format {columns, values} to op-sqlite format {rows: [{col: val}]}
            const { columns, values } = results[0];
            const rows = values.map(row => Object.fromEntries(columns.map((col, i) => [col, row[i]])));
            return { rows };
        },
        close: () => sqlJsDb.close(),
    };
}

// Mock op-sqlite
jest.mock('@op-engineering/op-sqlite', () => ({ open: jest.fn() }));

// Mock Keychain
jest.mock('react-native-keychain', () => ({
    getGenericPassword: jest.fn().mockResolvedValue({ password: 'test-key' }),
    setGenericPassword: jest.fn().mockResolvedValue(true),
    ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: '' },
    STORAGE_TYPE: { AES_GCM: '' },
}));

// Mock QuickCrypto
jest.mock('react-native-quick-crypto', () => ({
    getRandomValues: (arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) arr[i] = i % 256;
        return arr;
    },
}));

// Mock MMKV storage (async API for backwards compatibility)
const mockMMKVStorage: Record<string, string> = {};
// Mock AsyncStorage (for legacy chunked reads during migration)
const mockAsyncStorage: Record<string, string> = {};
jest.mock('~/global/storage', () => ({
    readFromStorage: jest.fn((key: string) => Promise.resolve(mockMMKVStorage[key] ?? null)),
    writeToStorage: jest.fn((key: string, value: string) => {
        mockMMKVStorage[key] = value;
    }),
    legacyReadFromAsyncStorage: jest.fn((key: string) => Promise.resolve(mockAsyncStorage[key] ?? null)),
    legacyDeleteFromAsyncStorage: jest.fn((key: string) => {
        delete mockAsyncStorage[key];
        return Promise.resolve();
    }),
}));

import { setDb, dbGetMessages, dbGetConversations, migrateFromAsyncStorage } from '../database';

// Sample AsyncStorage data
const asyncStorageData = new Map<string, Conversation>([
    [
        '+1111111111',
        {
            other_user: {
                id: '101',
                phone_no: '+1111111111',
                last_seen: 1700000000000,
                online: true,
                pic: 'https://example.com/pic1.jpg',
                public_key: 'pubkey-101',
            },
            messages: [
                {
                    id: 1,
                    message: 'MQ==:iv:encrypted-hello',
                    sent_at: '2024-01-15T10:30:00.000Z',
                    seen: true,
                    reciever: '+1111111111',
                    reciever_id: '101',
                    sender: '+0000000000',
                    sender_id: '100',
                },
                {
                    id: 2,
                    message: 'MQ==:iv:encrypted-reply',
                    sent_at: '2024-01-15T10:31:00.000Z',
                    seen: false,
                    reciever: '+0000000000',
                    reciever_id: '100',
                    sender: '+1111111111',
                    sender_id: '101',
                },
            ],
        },
    ],
    [
        '+2222222222',
        {
            other_user: {
                id: '102',
                phone_no: '+2222222222',
                last_seen: 1700000001000,
                online: false,
                pic: undefined,
                public_key: undefined,
            },
            messages: [
                {
                    id: 3,
                    message: 'MQ==:iv:encrypted-other',
                    sent_at: '2024-01-16T12:00:00.000Z',
                    seen: true,
                    reciever: '+2222222222',
                    reciever_id: '102',
                    sender: '+0000000000',
                    sender_id: '100',
                },
            ],
        },
    ],
]);

// Normalize for comparison (DB stores IDs as strings, is_decrypted defaults to false)
const normalizeMessage = (msg: message): message => ({
    ...msg,
    reciever_id: String(msg.reciever_id),
    sender_id: String(msg.sender_id),
    is_decrypted: false,
});

const normalizeUser = (user: UserData): UserData => ({
    ...user,
    id: String(user.id),
    online: false,
});

describe('database migration', () => {
    let SQL: Awaited<ReturnType<typeof initSqlJs>>;

    beforeAll(async () => {
        SQL = await initSqlJs();
    });

    beforeEach(() => {
        // Clear mock storages
        Object.keys(mockMMKVStorage).forEach(key => delete mockMMKVStorage[key]);
        Object.keys(mockAsyncStorage).forEach(key => delete mockAsyncStorage[key]);
        // Set up old AsyncStorage data for migration
        mockAsyncStorage['messages-test-user'] = JSON.stringify(Array.from(asyncStorageData.entries()));

        // Create fresh in-memory database with adapter
        const sqlJsDb = new SQL.Database();
        const adapter = createOpSqliteAdapter(sqlJsDb);
        setDb(adapter as any, true);
    });

    afterEach(() => {
        setDb(null);
    });

    it('messages should be identical after migration', async () => {
        await migrateFromAsyncStorage('test-user');

        const originalMessages = asyncStorageData.get('+1111111111')!.messages;
        const migratedMessages = dbGetMessages('+1111111111');

        // DB returns messages in DESC order (newest first), so reverse for comparison
        const expectedMessages = originalMessages.toReversed().map(normalizeMessage);
        expect(migratedMessages).toEqual(expectedMessages);
    });

    it('conversations should be identical after migration', async () => {
        await migrateFromAsyncStorage('test-user');

        const migratedConversations = dbGetConversations();
        expect(migratedConversations).toHaveLength(asyncStorageData.size);

        for (const migrated of migratedConversations) {
            const original = asyncStorageData.get(migrated.other_user.phone_no);
            expect(original).toBeDefined();
            expect(migrated.other_user).toEqual(normalizeUser(original!.other_user));
        }
    });

    it('should handle empty data', async () => {
        mockAsyncStorage['messages-empty-user'] = JSON.stringify([]);
        await migrateFromAsyncStorage('empty-user');

        expect(dbGetConversations()).toHaveLength(0);
    });

    it('should handle multiple conversations', async () => {
        await migrateFromAsyncStorage('test-user');

        expect(dbGetConversations()).toHaveLength(2);
        expect(dbGetMessages('+1111111111')).toHaveLength(2);
        expect(dbGetMessages('+2222222222')).toHaveLength(1);
    });

    it('should skip migration if already migrated', async () => {
        mockMMKVStorage['sqlite-migrated'] = 'true';

        const result = await migrateFromAsyncStorage('test-user');

        expect(result).toBe(false);
        expect(dbGetConversations()).toHaveLength(0);
    });

    it('should set migration flag after migration', async () => {
        expect(mockMMKVStorage['sqlite-migrated']).toBeUndefined();

        await migrateFromAsyncStorage('test-user');

        expect(mockMMKVStorage['sqlite-migrated']).toBe('true');
    });

    it('should clean up AsyncStorage after successful migration', async () => {
        expect(mockAsyncStorage['messages-test-user']).toBeDefined();

        await migrateFromAsyncStorage('test-user');

        expect(mockAsyncStorage['messages-test-user']).toBeUndefined();
    });
});
