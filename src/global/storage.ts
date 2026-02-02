import { createMMKV, type MMKV } from 'react-native-mmkv';
import * as Keychain from 'react-native-keychain';
import QuickCrypto from 'react-native-quick-crypto';
import { Buffer } from 'buffer';

const MMKV_KEY_SERVICE = 'foxtrot-mmkv-key';
const MMKV_ENCRYPTION_MIGRATED_FLAG = 'mmkv-encryption-migrated';

let storage: MMKV | null = null;
let storageInitPromise: Promise<MMKV> | null = null;

async function getOrCreateMmkvKey(): Promise<string> {
    try {
        const credentials = await Keychain.getGenericPassword({ service: MMKV_KEY_SERVICE });
        if (credentials && credentials.password) {
            return credentials.password;
        }
    } catch (err) {
        console.debug('No existing MMKV key found, generating new one');
    }

    const keyBytes = QuickCrypto.getRandomValues(new Uint8Array(16));
    const key = Buffer.from(keyBytes).toString('hex');

    await Keychain.setGenericPassword(MMKV_KEY_SERVICE, key, {
        service: MMKV_KEY_SERVICE,
        storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
    });

    console.debug('Generated and stored new MMKV encryption key');
    return key;
}

/**
 * Gets the storage instance, initializing it with encryption if needed.
 * Handles migration from unencrypted to encrypted storage on first run.
 */
async function getStorage(): Promise<MMKV> {
    if (storage) {
        return storage;
    }

    // Prevent concurrent initialization
    if (storageInitPromise) {
        return storageInitPromise;
    }

    storageInitPromise = (async () => {
        const encryptionKey = await getOrCreateMmkvKey();

        // Check if encryption migration has occurred using a separate unencrypted instance
        // We need to read the flag before we know whether to use encryption
        const tempStorage = createMMKV({ id: 'foxtrot-storage' });
        const migrated = tempStorage.getString(MMKV_ENCRYPTION_MIGRATED_FLAG);

        if (migrated === 'true') {
            // Already migrated, open with encryption directly
            storage = createMMKV({
                id: 'foxtrot-storage',
                encryptionKey,
            });
            console.debug('MMKV storage opened with encryption');
        } else {
            // Not yet migrated - use unencrypted instance, then recrypt
            storage = tempStorage;
            console.debug('MMKV storage opened without encryption, migrating...');

            // Encrypt all existing data
            storage.recrypt(encryptionKey);
            console.debug('MMKV storage encrypted with recrypt()');

            // Set the migration flag (now encrypted)
            storage.set(MMKV_ENCRYPTION_MIGRATED_FLAG, 'true');
            console.debug('MMKV encryption migration complete');
        }

        return storage;
    })();

    return storageInitPromise;
}

export async function writeToStorage(key: string, value: string): Promise<void> {
    const s = await getStorage();
    s.set(key, value);
}

export async function readFromStorage(key: string): Promise<string | null> {
    const s = await getStorage();
    return s.getString(key) ?? null;
}

export async function deleteFromStorage(key: string): Promise<void> {
    const s = await getStorage();
    s.remove(key);
}

export async function popFromStorage(key: string): Promise<string | null> {
    const value = await readFromStorage(key);
    if (value !== null) {
        await deleteFromStorage(key);
    }
    return value;
}

export async function getAllStorageKeys(): Promise<string[]> {
    const s = await getStorage();
    return s.getAllKeys();
}
