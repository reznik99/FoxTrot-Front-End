import crypto from 'crypto';
import { Buffer } from 'buffer';

interface MockCryptoKey {
    type: string;
    algorithm: { name: string; length?: number };
    extractable: boolean;
    usages: string[];
    _keyData: Buffer;
}

const mockQuickCrypto = {
    getRandomValues: <T extends Uint8Array>(array: T): T => {
        const bytes = crypto.randomBytes(array.length);
        array.set(bytes);
        return array;
    },
    subtle: {
        importKey: async (
            format: string,
            keyData: BufferSource,
            algorithm: string | { name: string; length?: number },
            extractable: boolean,
            keyUsages: string[],
        ): Promise<MockCryptoKey> => {
            if (format === 'raw') {
                return {
                    type: 'secret',
                    algorithm: typeof algorithm === 'string' ? { name: algorithm } : algorithm,
                    extractable,
                    usages: keyUsages,
                    _keyData: Buffer.from(keyData as ArrayBuffer),
                };
            }
            throw new Error(`Unsupported key format: ${format}`);
        },
        exportKey: async (format: string, key: MockCryptoKey): Promise<ArrayBuffer> => {
            if (format === 'raw') {
                return key._keyData.buffer.slice(
                    key._keyData.byteOffset,
                    key._keyData.byteOffset + key._keyData.byteLength,
                ) as ArrayBuffer;
            }
            throw new Error(`Unsupported export format: ${format}`);
        },
        encrypt: async (
            algorithm: { name: string; iv: Uint8Array },
            key: MockCryptoKey,
            data: BufferSource,
        ): Promise<Buffer> => {
            const plaintext = Buffer.from(data as ArrayBuffer);
            const iv = Buffer.from(algorithm.iv);

            if (algorithm.name === 'AES-GCM') {
                const cipher = crypto.createCipheriv('aes-256-gcm', key._keyData, iv);
                const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
                const authTag = cipher.getAuthTag();
                return Buffer.concat([encrypted, authTag]);
            } else if (algorithm.name === 'AES-CBC') {
                const cipher = crypto.createCipheriv('aes-256-cbc', key._keyData, iv);
                return Buffer.concat([cipher.update(plaintext), cipher.final()]);
            }
            throw new Error(`Unsupported algorithm: ${algorithm.name}`);
        },
        decrypt: async (
            algorithm: { name: string; iv: Buffer | Uint8Array },
            key: MockCryptoKey,
            data: BufferSource,
        ): Promise<Buffer> => {
            const ciphertext = Buffer.from(data as ArrayBuffer);
            const iv = Buffer.from(algorithm.iv);

            if (algorithm.name === 'AES-GCM') {
                const authTag = ciphertext.slice(-16);
                const encrypted = ciphertext.slice(0, -16);
                const decipher = crypto.createDecipheriv('aes-256-gcm', key._keyData, iv);
                decipher.setAuthTag(authTag);
                return Buffer.concat([decipher.update(encrypted), decipher.final()]);
            } else if (algorithm.name === 'AES-CBC') {
                const decipher = crypto.createDecipheriv('aes-256-cbc', key._keyData, iv);
                return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
            }
            throw new Error(`Unsupported algorithm: ${algorithm.name}`);
        },
        digest: async (algorithm: { name: string }, data: BufferSource): Promise<ArrayBuffer> => {
            const hashName = algorithm.name.replace('-', '').toLowerCase();
            const hash = crypto.createHash(hashName);
            hash.update(Buffer.from(data as ArrayBuffer));
            const result = hash.digest();
            return result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength) as ArrayBuffer;
        },
    },
};

jest.mock('react-native-quick-crypto', () => mockQuickCrypto);

global.console.debug = jest.fn();
