import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Writes given data to given key in AsyncStorage. If data exceeds 1 MiB, it is split into chunks.
 * Chunks are stored with keys in the format 'key', 'key-chunk1', 'key-chunk2', ...
 * To read all chunks for a key, use `readFromStorage` function.
 * To delete all chunks for a key, use `deleteFromStorage` function.
 * @param key Unique key to store data under
 * @param data Stringified data to store
 */
export async function writeToStorage(key: string, data: string) {
    const chunks = data.match(/.{1,1048576}/g) || [data]; // Split on 1 Mib

    for (let i = 0; i < chunks.length; i++) {
        const index = i === 0 ? '' : '-chunk' + i;
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
    let data = '';
    let i = 0;
    while (true) {
        try {
            const index = i === 0 ? '' : '-chunk' + i;
            const chunk = await AsyncStorage.getItem(key + index);
            if (!chunk) { break; } // Finished chunks

            data += chunk;
            i++;
        } catch (err) {
            break; // Finished chunks
        }
    }

    console.debug('Read', i, 'chunk(s) from storage for', key);
    return data;
}

/**
 * Deletes data from AsyncStorage under given key.
 * It handles deleting chunked data, previously stored with `writeToStorage` function.
 * @param key Unique key to find data under
 */
export async function deleteFromStorage(key: string) {
    const keys = (await AsyncStorage.getAllKeys()).filter(k => k.includes(key));
    AsyncStorage.multiRemove(keys);
    console.debug('Deleted', keys.length, 'chunk(s) from storage for', key);
}
