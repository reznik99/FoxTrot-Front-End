
// Crypto
import { Buffer } from 'buffer'
import { KeypairAlgorithm } from '~/global/variables';

interface exportedKeypair {
    privateKey: string
    publicKey: string
}

const chunkSize = 32 * 1024;

export async function importKeypair(keyPair: exportedKeypair): Promise<CryptoKeyPair> {

    const privateKey = await crypto.subtle.importKey(
        'pkcs8',
        Buffer.from(keyPair.privateKey, 'base64'),
        KeypairAlgorithm,
        true,
        ['deriveKey', 'deriveBits']
    )

    const publicKey = await crypto.subtle.importKey(
        'spki',
        Buffer.from(keyPair.publicKey, 'base64'),
        KeypairAlgorithm,
        true,
        []
    )

    return { privateKey, publicKey }
}

export async function exportKeypair(keyPair: CryptoKeyPair): Promise<exportedKeypair> {
    return {
        publicKey: Buffer.from(await crypto.subtle.exportKey('spki', keyPair.publicKey)).toString('base64'),
        privateKey: Buffer.from(await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)).toString('base64')
    }
}

export async function generateSessionKeyECDH(peerPublic: string, userPrivate: CryptoKey | undefined): Promise<CryptoKey> {

    if (!peerPublic) throw new Error("Contacts's public key not present. ECDHE failed")
    if (!userPrivate) throw new Error("User private key not loaded. ECDHE failed")

    const publicKey = await crypto.subtle.importKey(
        'spki',
        Buffer.from(peerPublic, 'base64'),
        KeypairAlgorithm,
        true,
        []
    )

    const sessionKey = await crypto.subtle.deriveKey(
        {
            name: KeypairAlgorithm.name,
            public: publicKey,
            namedCurve: KeypairAlgorithm.namedCurve
        } as any,
        userPrivate,
        {
            name: "AES-CBC",
            length: 256
        },
        true,
        ["encrypt", "decrypt"]
    )

    return sessionKey
}

export async function deriveKeyFromPassword(password: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
    // Derive Key from password using PBKDF2
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        Buffer.from(password),
        "PBKDF2",
        false,
        ["deriveBits", "deriveKey"],
    );

    return await crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt,
            iterations: iterations,
            hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"],
    );
}

export async function decrypt(sessionKey: CryptoKey, encryptedMessage: string): Promise<string> {

    const [IV, cipherText] = encryptedMessage.split(":")
    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-CBC", iv: Buffer.from(IV, 'base64') },
        sessionKey,
        Buffer.from(cipherText, 'base64')
    )

    return Buffer.from(decrypted).toString()
}

export async function encrypt(sessionKey: CryptoKey, message: string): Promise<string> {

    const IV = crypto.getRandomValues(new Uint8Array(16));
    const cipherText = await crypto.subtle.encrypt(
        { name: "AES-CBC", iv: IV },
        sessionKey,
        Buffer.from(message)
    )

    return Buffer.from(IV).toString("base64") + ":" + Buffer.from(cipherText).toString("base64")
}