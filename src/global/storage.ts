import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'foxtrot-storage' });

export function writeToStorage(key: string, value: string): void {
    storage.set(key, value);
}

export function readFromStorage(key: string): string | null {
    return storage.getString(key) ?? null;
}

export function deleteFromStorage(key: string): void {
    storage.remove(key);
}

export function popFromStorage(key: string): string | null {
    const value = readFromStorage(key);
    if (value !== null) {
        deleteFromStorage(key);
    }
    return value;
}

export function getAllStorageKeys(): string[] {
    return storage.getAllKeys();
}
