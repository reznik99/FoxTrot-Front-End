
// Crypto
import { Buffer } from 'buffer';
import QuickCrypto, { CryptoKey as QCCryptoKey, RandomTypedArrays } from 'react-native-quick-crypto';
import { KeypairAlgorithm } from '~/global/variables';

interface exportedKeypair {
    privateKey: string
    publicKey: string
}

/** Generates an Identity Keypair for this account/device */
export async function generateIdentityKeypair(): Promise<CryptoKeyPair> {
    // react-native-quick-crypto ✅
    const keyPair = await window.crypto.subtle.generateKey(
        KeypairAlgorithm,
        true,
        ['deriveKey']
    );
    return keyPair;
}

/** Imports an Identity Keypair into a usable Webcrypto form */
export async function importKeypair(keyPair: exportedKeypair): Promise<CryptoKeyPair> {
    // react-native-quick-crypto ✅
    const privateKey = await crypto.subtle.importKey(
        'pkcs8',
        Buffer.from(keyPair.privateKey, 'base64'),
        KeypairAlgorithm,
        true,
        ['deriveKey', 'deriveBits']
    );
    // react-native-quick-crypto ✅
    const publicKey = await crypto.subtle.importKey(
        'spki',
        Buffer.from(keyPair.publicKey, 'base64'),
        KeypairAlgorithm,
        true,
        []
    );

    return { privateKey, publicKey };
}

/** Exports an Identity Keypair into JSON form containing Public and Private Key in DER Base64 */
export async function exportKeypair(keyPair: CryptoKeyPair): Promise<exportedKeypair> {
    // react-native-quick-crypto ✅
    return {
        publicKey: Buffer.from(await crypto.subtle.exportKey('spki', keyPair.publicKey)).toString('base64'),
        privateKey: Buffer.from(await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)).toString('base64'),
    };
}

/** Generates a 256bit AES-CBC Encryption key for messages with a user */
export async function generateSessionKeyECDH(peerPublic: string, userPrivate: CryptoKey | undefined): Promise<QCCryptoKey> {

    if (!peerPublic) { throw new Error("Contacts's public key not present. ECDHE failed"); }
    if (!userPrivate) { throw new Error('User private key not loaded. ECDHE failed'); }
    // react-native-quick-crypto ✅
    const publicKey = await crypto.subtle.importKey(
        'spki',
        Buffer.from(peerPublic, 'base64'),
        KeypairAlgorithm,
        true,
        []
    );

    // https://github.com/margelo/react-native-quick-crypto/blob/main/.docs/implementation-coverage.md
    // react-native-quick-crypto ❌
    const sessionKey = await crypto.subtle.deriveKey(
        {
            name: KeypairAlgorithm.name,
            public: publicKey,
            namedCurve: KeypairAlgorithm.namedCurve,
        } as any,
        userPrivate,
        {
            name: 'AES-CBC',
            length: 256,
        },
        true,
        ['encrypt', 'decrypt']
    );

    const rawSessionKey = await crypto.subtle.exportKey('raw', sessionKey)
    const newSessionKey = await QuickCrypto.subtle.importKey(
        'raw',
        rawSessionKey,
        { name: 'AES-CBC', length: 256 },
        false,
        ['encrypt', 'decrypt']
    )

    return newSessionKey;
}

/** Derives a 256bit AES-GCM Key Encryption key from a password and salt. Allows customising PBKDF2 difficulty through *Iterations* parameter */
export async function deriveKeyFromPassword(password: string, salt: RandomTypedArrays, iterations: number): Promise<QCCryptoKey> {
    // Derive Key from password using PBKDF2
    const keyMaterial = await QuickCrypto.subtle.importKey(
        'raw',
        Buffer.from(password),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey'],
    );
    return await QuickCrypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt as any,
            iterations: iterations,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt'],
    );
}

/** Returns the SHA-256 fingerprint of the public key as an Uppercase HEX string with a space separator */
export async function publicKeyFingerprint(peerPublic: string): Promise<string> {
    const digest = await QuickCrypto.subtle.digest(
        { name: 'SHA-256' },
        Buffer.from(peerPublic, 'base64')
    );

    return Buffer.from(digest).toString('hex').toUpperCase().split('').reduce((prev, curr, i) => prev + curr + (i % 2 === 1 ? ' ' : ''), '');
}

/** Decrypts a given base64 message using the supplied AES Session Key (generated from *generateSessionKeyECDH*) and returns it as a string. */
export async function decrypt(sessionKey: QCCryptoKey, encryptedMessage: string): Promise<string> {
    if (!sessionKey) { throw new Error("SessionKey isn't initialized. Please import your Identity Keys exported from you previous device."); }

    const startTime = performance.now();
    const chunks = encryptedMessage.split(':');
    const promises = [];

    for (let i = 0; i < chunks.length; i += 2) {
        const iv = Buffer.from(chunks[i], 'base64');
        const cipherText = Buffer.from(chunks[i + 1], 'base64');
        promises.push(QuickCrypto.subtle.decrypt({ name: 'AES-CBC', iv: iv }, sessionKey, cipherText));
    }

    const decryptedChunks = await Promise.all(promises);

    console.debug('Decrypt took:', (performance.now() - startTime).toLocaleString(), 'ms', '| chunks:', decryptedChunks.length);
    return decryptedChunks.map(chunk => Buffer.from(chunk).toString()).join('');
}

/** Encrypts a given message using the supplied AES Session Key (generated from *generateSessionKeyECDH*) and returns it as a Base64 string. */
export async function encrypt(sessionKey: QCCryptoKey, message: string): Promise<string> {
    if (!sessionKey) { throw new Error("SessionKey isn't initialized. Please import your Identity Keys exported from you previous device."); }

    const startTime = performance.now();
    const messageBuf = Buffer.from(message);

    const iv = QuickCrypto.getRandomValues(new Uint8Array(16));
    const ciphertext = await QuickCrypto.subtle.encrypt({ name: 'AES-CBC', iv: iv }, sessionKey, messageBuf)

    console.debug('Encrypt took:', (performance.now() - startTime).toLocaleString(), 'ms');
    return Buffer.from(iv).toString('base64') + ':' + Buffer.from(ciphertext).toString('base64');
}