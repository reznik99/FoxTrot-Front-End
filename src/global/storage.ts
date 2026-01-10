import AsyncStorage from '@react-native-async-storage/async-storage';

const chunk_separator = '-chunk'; // Used if data is > 1Mib (1048576) 

// Returns all existing keys that belong to the given key (key + chunks)
async function getRelatedKeys(key: string) {
    const allKeys = await AsyncStorage.getAllKeys();
    return allKeys.filter(k => k === key || k.startsWith(key + chunk_separator));
}

/**
 * Writes given data to given key in AsyncStorage. If data exceeds 1 MiB, it is split into chunks.
 * Chunks are stored with keys in the format 'key', 'key-chunk1', 'key-chunk2', ...
 * To read all chunks for a key, use `readFromStorage` function.
 * To delete all chunks for a key, use `deleteFromStorage` function.
 * @param key Unique key to store data under
 * @param data Stringified data to store
 */
export async function writeToStorage(key: string, data: string) {
    // 1. Chunk data if greater than 1Mib
    const chunks = data.match(/.{1,1048576}/g) || [data]; // Split on 1 Mib
    // 2. Write chunks of data
    // TODO: use `multiSet` for efficiency
    for (let i = 0; i < chunks.length; i++) {
        const index = i === 0 ? '' : chunk_separator + i;
        await AsyncStorage.setItem(key + index, chunks[i]);
    }
    console.debug('Wrote', chunks.length, 'chunk(s) to storage for', key);
}

/**
 * Reads data from given key from AsyncStorage.
 * It handles reading chunked data, previously stored with `writeToStorage` function.
 * @param key Unique key to find data under
 */
export async function readFromStorage(key: string) {
    // 1. Get all relevant keys (e.g., 'myKey', 'myKey-chunk1', etc.)
    const keys = await getRelatedKeys(key);
    if (keys.length === 0) return null;
    // 2. Sort keys to ensure chunk1 comes after the base key, chunk2 after chunk1, etc.
    keys.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    // 3. Fetch all chunks in parallel
    const pairs = await AsyncStorage.multiGet(keys);
    // 4. Join the values
    const data = pairs.map(pair => pair[1]).join('');
    console.debug('Read', keys.length, 'chunk(s) from storage for', key);
    return data;
}

/**
 * Reads data from given key from AsyncStorage, and deletes it afterwards.
 * It handles reading chunked data, previously stored with `writeToStorage` function.
 * @param key Unique key to find data under
 */
export async function popFromStorage(key: string) {
    // 1. Read from storage
    const data = await readFromStorage(key);
    if (data) {
        // 2. Delete from storage if any data was returned
        await deleteFromStorage(key);
    }
    return data;
}
/**
 * Deletes data from AsyncStorage under given key.
 * It handles deleting chunked data, previously stored with `writeToStorage` function.
 * @param key Unique key to find data under
 */
export async function deleteFromStorage(key: string) {
    const keys = await getRelatedKeys(key);
    await AsyncStorage.multiRemove(keys);
    console.debug('Deleted', keys.length, 'chunk(s) from storage for', key);
}