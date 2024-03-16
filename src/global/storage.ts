import AsyncStorage from "@react-native-async-storage/async-storage";

export async function writeToStorage(key: string, data: string) {
    const chunks = data.match(/.{1,1048576}/g) || [data]; // Split on 1 Mib

    for (let i = 0; i < chunks.length; i++) {
        const index = i == 0 ? '' : '-chunk' + i
        await AsyncStorage.setItem(key + index, chunks[i])
    }

    console.debug("Wrote", chunks.length, "chunk(s) to storage for", key)
}

export async function readFromStorage(key: string) {
    let data = ""
    let i = 0
    while (true) {
        try {
            const index = i == 0 ? '' : '-chunk' + i
            const chunk = await AsyncStorage.getItem(key + index)
            if (!chunk) break // Finished chunks

            data += chunk
            i++
        } catch (err) {
            break; // Finished chunks
        }
    }

    console.debug("Read", i, "chunk(s) from storage for", key)
    return data
}

export async function deleteFromStorage(key: string) {
    const keys = (await AsyncStorage.getAllKeys()).filter(k => k.includes(key))
    AsyncStorage.multiRemove(keys)
}