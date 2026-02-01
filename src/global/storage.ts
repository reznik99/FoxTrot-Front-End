import AsyncStorage from '@react-native-async-storage/async-storage';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'foxtrot-storage' });

const chunk_separator = '-chunk'; // Used if data is > 1Mib (1048576)

// Returns all existing keys that belong to the given key (key + chunks)
async function getRelatedKeys(key: string) {
    // Get all keys, filter for the target keys and it's chunks, then sort the keys
    return (await AsyncStorage.getAllKeys())
        .filter(k => k === key || k.startsWith(key + chunk_separator))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

/**
 * Reads data from given key from AsyncStorage (legacy chunked format).
 * It handles reading chunked data, previously stored with the old writeToStorage function.
 * @param key Unique key to find data under
 */
export async function legacyReadFromAsyncStorage(key: string): Promise<string | null> {
    // 1. Get all relevant keys (e.g., 'myKey', 'myKey-chunk1', etc.)
    const keys = await getRelatedKeys(key);
    if (keys.length === 0) return null;
    // 2. Fetch all chunks in parallel
    const pairs = await AsyncStorage.multiGet(keys);
    // 3. Join the values
    const data = pairs.map(pair => pair[1]).join('');
    console.debug('Read', keys.length, 'chunk(s) from storage for', key);
    return data;
}

/**
 * Deletes data from AsyncStorage under given key (legacy chunked format).
 * It handles deleting chunked data, previously stored with the old writeToStorage function.
 * @param key Unique key to find data under
 */
export async function legacyDeleteFromAsyncStorage(key: string): Promise<void> {
    const keys = await getRelatedKeys(key);
    await AsyncStorage.multiRemove(keys);
    console.debug('Deleted', keys.length, 'chunk(s) from storage for', key);
}

export function writeToStorage(key: string, value: string): void {
    storage.set(key, value);
}

export async function readFromStorage(key: string): Promise<string | null> {
    // Try MMKV first
    const mmkvValue = storage.getString(key);
    if (mmkvValue !== undefined) {
        return mmkvValue;
    }

    // Fallback to AsyncStorage for backwards compatibility
    const asyncValue = await AsyncStorage.getItem(key);
    if (asyncValue !== null) {
        // Migrate to MMKV and delete from AsyncStorage
        storage.set(key, asyncValue);
        await AsyncStorage.removeItem(key);
    }

    return asyncValue;
}

export function deleteFromStorage(key: string): void {
    storage.remove(key);
    AsyncStorage.removeItem(key);
}

export async function popFromStorage(key: string): Promise<string | null> {
    const value = await readFromStorage(key);
    if (value !== null) {
        deleteFromStorage(key);
    }
    return value;
}

export function getAllStorageKeys(): string[] {
    return storage.getAllKeys();
}
