
// Crypto
var Buffer = require("@craftzdog/react-native-buffer").Buffer;

import { KeypairImport } from '~/global/variables';

interface exportedKeypair {
    privateKey: string
    publicKey: string
}

export async function importRSAKeypair(keyPair: any): Promise<CryptoKeyPair> {

    const privateKey = await window.crypto.subtle.importKey(
        'pkcs8',
        Buffer.from(keyPair.privateKey, 'base64'),
        KeypairImport,
        true,
        ['decrypt']
    )

    const publicKey = await window.crypto.subtle.importKey(
        'spki',
        Buffer.from(keyPair.publicKey, 'base64'),
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