import { Buffer } from 'buffer';
import QuickCrypto from 'react-native-quick-crypto';
import { encrypt, decrypt, initRatchetState, encryptV2, decryptV2, advanceRatchetToDay, RatchetState } from '../crypto';

// Hardcoded test key (256-bit AES key)
const TEST_KEY_BASE64 = '5ZFymSUme/8XA3T7f+FbGX7te8ri8N7iOQ5iHvyr/+A=';

// Test vectors
const TEST_VECTORS = {
    // "Hello, World!" encrypted with GCM (format: version:iv:ciphertext)
    gcmMessage: 'MQ==:WyPWnpu+rCFmK5P0:x1V7URvfnn7hMCI+mckwOjVDfCvuS9eyPb9Ouog=',
    gcmPlaintext: 'Hello, World!',

    // "Hello, World!" encrypted with GCM without version prefix (format: iv:ciphertext, 12-byte IV)
    gcmNoVersion: 'WyPWnpu+rCFmK5P0:x1V7URvfnn7hMCI+mckwOjVDfCvuS9eyPb9Ouog=',
    gcmNoVersionPlaintext: 'Hello, World!',

    // "Hello, World!" encrypted with CBC legacy (format: iv:ciphertext)
    cbcSingleChunk: 'oZYIgo24l9yYXwBm9+QV+Q==:z7eECS1KfKmxqG7OXpN6SQ==',
    cbcSinglePlaintext: 'Hello, World!',

    // "This is a longer message for chunked CBC" encrypted with CBC chunked (format: iv:ct:iv:ct:...)
    cbcChunked:
        '2m8ysP4RzewlMAdTkPHWzg==:4baP9Ja5sbi3jLBflFtksvjdijEX97pGaN4f8opE/Gs=:HT7s1VpmhF3e9WJ48uE5pQ==:OPitQJms2Z/dT2hGGJpC0PYGBKdOZsBQGx/5hKtrTVo=:9NB220Dtq+8zWf7odb8uTg==:hhTQe4KniSdj6K2ey3HDMg==',
    cbcChunkedPlaintext: 'This is a longer message for chunked CBC',
};

// Helper to create session key from base64
async function createSessionKey(base64Key: string) {
    const keyData = Buffer.from(base64Key, 'base64');
    return QuickCrypto.subtle.importKey('raw', keyData, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

describe('crypto.ts', () => {
    describe('encrypt', () => {
        it('should encrypt a message and return base64 format version:iv:ciphertext', async () => {
            const sessionKey = await createSessionKey(TEST_KEY_BASE64);
            const message = 'Hello, World!';

            const encrypted = await encrypt(sessionKey, message);

            const parts = encrypted.split(':');
            expect(parts).toHaveLength(3);

            // Version should decode to "1" (GCM_V1)
            const version = Buffer.from(parts[0], 'base64').toString();
            expect(version).toBe('1');

            // IV should be 12 bytes
            const iv = Buffer.from(parts[1], 'base64');
            expect(iv.length).toBe(12);
        });

        it('should throw error when session key is null/undefined', async () => {
            await expect(encrypt(null as any, 'test')).rejects.toThrow("SessionKey isn't initialized");
            await expect(encrypt(undefined as any, 'test')).rejects.toThrow("SessionKey isn't initialized");
        });

        it('should produce different ciphertexts for the same message (random IV)', async () => {
            const sessionKey = await createSessionKey(TEST_KEY_BASE64);
            const message = 'Same message';

            const encrypted1 = await encrypt(sessionKey, message);
            const encrypted2 = await encrypt(sessionKey, message);

            expect(encrypted1).not.toBe(encrypted2);
        });

        it('should round-trip with decrypt', async () => {
            const sessionKey = await createSessionKey(TEST_KEY_BASE64);
            const message = 'Round trip test message';

            const encrypted = await encrypt(sessionKey, message);
            const decrypted = await decrypt(sessionKey, encrypted);

            expect(decrypted).toBe(message);
        });
    });

    describe('decrypt', () => {
        describe('GCM format', () => {
            it('should decrypt GCM message with version prefix', async () => {
                const sessionKey = await createSessionKey(TEST_KEY_BASE64);

                const decrypted = await decrypt(sessionKey, TEST_VECTORS.gcmMessage);

                expect(decrypted).toBe(TEST_VECTORS.gcmPlaintext);
            });

            it('should decrypt GCM message without version prefix', async () => {
                const sessionKey = await createSessionKey(TEST_KEY_BASE64);

                const decrypted = await decrypt(sessionKey, TEST_VECTORS.gcmNoVersion);

                expect(decrypted).toBe(TEST_VECTORS.gcmNoVersionPlaintext);
            });
        });

        describe('Legacy CBC format', () => {
            it('should decrypt single-chunk CBC message', async () => {
                const sessionKey = await createSessionKey(TEST_KEY_BASE64);

                const decrypted = await decrypt(sessionKey, TEST_VECTORS.cbcSingleChunk);

                expect(decrypted).toBe(TEST_VECTORS.cbcSinglePlaintext);
            });

            it('should decrypt multi-chunk CBC message', async () => {
                const sessionKey = await createSessionKey(TEST_KEY_BASE64);

                const decrypted = await decrypt(sessionKey, TEST_VECTORS.cbcChunked);

                expect(decrypted).toBe(TEST_VECTORS.cbcChunkedPlaintext);
            });
        });

        describe('error cases', () => {
            it('should throw error when session key is null/undefined', async () => {
                await expect(decrypt(null as any, 'test:data')).rejects.toThrow("SessionKey isn't initialized");
                await expect(decrypt(undefined as any, 'test:data')).rejects.toThrow("SessionKey isn't initialized");
            });

            it('should throw error for message without separator', async () => {
                const sessionKey = await createSessionKey(TEST_KEY_BASE64);

                await expect(decrypt(sessionKey, 'noseparator')).rejects.toThrow('Failed to find ":" separator in message');
            });

            it('should throw error for unknown version number', async () => {
                const sessionKey = await createSessionKey(TEST_KEY_BASE64);
                const unknownVersion = Buffer.from('99').toString('base64');
                const fakeIv = Buffer.alloc(12).toString('base64');
                const fakeCiphertext = Buffer.from('fake').toString('base64');
                const invalidMessage = `${unknownVersion}:${fakeIv}:${fakeCiphertext}`;

                await expect(decrypt(sessionKey, invalidMessage)).rejects.toThrow('Unknown protocol version: 99');
            });

            it('should throw error for corrupted ciphertext', async () => {
                const sessionKey = await createSessionKey(TEST_KEY_BASE64);
                const version = Buffer.from('1').toString('base64');
                const iv = Buffer.alloc(12).toString('base64');
                const corruptedCiphertext = Buffer.from('corrupted').toString('base64');
                const corruptedMessage = `${version}:${iv}:${corruptedCiphertext}`;

                await expect(decrypt(sessionKey, corruptedMessage)).rejects.toThrow();
            });
        });
    });
});

// ============================================================================
// EXPERIMENTAL V2 RATCHET TESTS
// ============================================================================

describe('V2 Ratchet (experimental)', () => {
    // Hardcoded shared secret (simulating X25519 output)
    const TEST_SHARED_SECRET = Buffer.from(TEST_KEY_BASE64, 'base64');

    it('should encrypt and decrypt with ratchet - with logging', async () => {
        console.log('\n=== V2 Ratchet Test ===\n');

        // Initialize ratchet state (simulates first contact setup)
        const state = await initRatchetState(TEST_SHARED_SECRET.buffer);
        console.log('Initial state:', state);

        // Encrypt first message (day 0)
        const msg1 = 'Hello from day 0!';
        const result1 = await encryptV2(state, msg1);
        console.log('\nMessage 1 encrypted:', { plaintext: msg1, ciphertext: result1.ciphertext });
        console.log('State after encrypt:', result1.state);

        // Decrypt it back
        const decrypted1 = await decryptV2(result1.state, result1.ciphertext);
        console.log('Message 1 decrypted:', decrypted1.plaintext);
        console.log('State after decrypt:', decrypted1.state);
        expect(decrypted1.plaintext).toBe(msg1);

        // Simulate advancing to day 3 (manually advance state, simulating 3 days passing)
        console.log('\n--- Simulating day 3 (advancing ratchet) ---');
        const stateDay3 = await advanceRatchetToDay(result1.state, 3);
        console.log('State after advancing to day 3:', stateDay3);

        // Manually build a day 3 message (since encryptV2 uses real time)
        // We'll just test that we can decrypt a message encrypted at day 3
        const msg2 = 'Hello from day 3!';
        // Manually encrypt using day 3 state's key
        const dayKey = await QuickCrypto.subtle.importKey(
            'raw',
            Buffer.from(stateDay3.currentDayKey, 'base64'),
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt'],
        );
        const iv = QuickCrypto.getRandomValues(new Uint8Array(12));
        const ciphertext = await QuickCrypto.subtle.encrypt({ name: 'AES-GCM', iv }, dayKey, Buffer.from(msg2));
        const msg2Encrypted =
            Buffer.from('2').toString('base64') +
            ':' +
            stateDay3.epoch +
            ':' +
            stateDay3.currentDayOffset +
            ':' +
            Buffer.from(iv).toString('base64') +
            ':' +
            Buffer.from(ciphertext).toString('base64');
        console.log('\nMessage 2 encrypted (day 3):', { plaintext: msg2, ciphertext: msg2Encrypted });

        // Decrypt day 3 message
        const decrypted2 = await decryptV2(stateDay3, msg2Encrypted);
        console.log('Message 2 decrypted:', decrypted2.plaintext);
        console.log('State after decrypt:', decrypted2.state);
        expect(decrypted2.plaintext).toBe(msg2);

        // Can still decrypt day 0 message (within 7 day window)
        console.log('\n--- Decrypting old message from day 0 ---');
        const decryptedOld = await decryptV2(stateDay3, result1.ciphertext);
        console.log('Old message decrypted:', decryptedOld.plaintext);
        console.log('State after decrypt:', decryptedOld.state);
        expect(decryptedOld.plaintext).toBe(msg1);

        // Advance to day 10 (day 0 key should be pruned)
        console.log('\n--- Advancing to day 10 (day 0 key will be pruned) ---');
        const stateDay10 = await advanceRatchetToDay(stateDay3, 10);
        console.log('State after advancing to day 10:', stateDay10);

        // Day 0 message should now fail (key pruned)
        console.log('\n--- Attempting to decrypt pruned day 0 message ---');
        await expect(decryptV2(stateDay10, result1.ciphertext)).rejects.toThrow('Message too old');
        console.log('Correctly rejected old message (forward secrecy working!)');

        console.log('\n=== Test Complete ===\n');
    });
});
