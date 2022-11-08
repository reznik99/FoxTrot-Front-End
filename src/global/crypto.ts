
// Crypto
var Buffer = require("@craftzdog/react-native-buffer").Buffer;

import { KeypairImport } from '~/global/variables';

interface exportedKeypair {
    privateKey: ArrayBuffer
    publicKey: ArrayBuffer
}

export async function importRSAKeypair(keyPair: exportedKeypair): Promise<CryptoKeyPair> {

    const privateKey = await window.crypto.subtle.importKey(
        'pkcs8',
        keyPair.privateKey,
        KeypairImport,
        true,
        ['decrypt']
    )

    const publicKey = await window.crypto.subtle.importKey(
        'spki',
        keyPair.publicKey,
        KeypairImport,
        true,
        ['encrypt']
    )

    return { privateKey, publicKey }
}

export async function exportRSAKeypair(keyPair: CryptoKeyPair): Promise<exportedKeypair> {
    return {
        publicKey: Buffer.from(await window.crypto.subtle.exportKey('spki', keyPair.publicKey)).toString('base64'),
        privateKey: Buffer.from(await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey)).toString('base64')
    }
}