
// Crypto
var Buffer = require("@craftzdog/react-native-buffer").Buffer;

import { KeypairAlgorithm } from '~/global/variables';

interface exportedKeypair {
    privateKey: string
    publicKey: string
}

export async function importKeypair(keyPair: exportedKeypair): Promise<CryptoKeyPair> {

    const privateKey = await window.crypto.subtle.importKey(
        'pkcs8',
        Buffer.from(keyPair.privateKey, 'base64'),
        KeypairAlgorithm,
        true,
        ['deriveKey']
    )

    const publicKey = await window.crypto.subtle.importKey(
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
        publicKey: Buffer.from(await window.crypto.subtle.exportKey('spki', keyPair.publicKey)).toString('base64'),
        privateKey: Buffer.from(await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey)).toString('base64')
    }
}

export async function generateSessionKeyECDH(peerPublic: string, userPrivate: CryptoKey | undefined): Promise<CryptoKey> {

    if (!peerPublic) throw new Error("Contacts's peerPublic not present. Cannot generate ECDH Session key")
    if (!userPrivate) throw new Error("User private key not loaded. Cannot generate ECDH Session key")

    const publicKey = await window.crypto.subtle.importKey(
        'spki',
        Buffer.from(peerPublic, 'base64'),
        KeypairAlgorithm,
        true,
        []
    )

    console.debug("Imported Contact's public ECDH Key")

    const sessionKey = await window.crypto.subtle.deriveKey(
        {
            name: "ECDH",
            public: publicKey
        },
        userPrivate,
        {
        name: "AES-GCM",
        length: 256
        },
        true,
        ["encrypt", "decrypt"]
    )

    return sessionKey
}

export async function decryptAESGCM(sessionKey: CryptoKey, encryptedMessage: string): Promise<string> {

    const [IV, cipherText] = encryptedMessage.split(":")
    
    console.log("IV:", IV)
    console.log("cipherText:", cipherText)
    console.log("sessionKey:", sessionKey)

    const decrypted = await window.crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: Buffer.from(IV, 'base64')
        },
        sessionKey,
        Buffer.from(cipherText, 'base64')
    )
    console.log("decrypted:", decrypted)
    return Buffer.from(decrypted).toString()
}

export async function encryptAESGCM(sessionKey: CryptoKey, message: string): Promise<string> {


    const IV =  window.crypto.getRandomValues(new Uint8Array(12));
    const cipherText = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: IV
        },
        sessionKey,
        Buffer.from(message, 'ascii')
    )
    
    console.log("IV:", Buffer.from(IV).toString("base64"))
    console.log("cipherText:", Buffer.from(cipherText).toString("base64"))
    console.log("sessionKey:", sessionKey)

    return Buffer.from(IV).toString("base64") + ":" + Buffer.from(cipherText).toString("base64")
}