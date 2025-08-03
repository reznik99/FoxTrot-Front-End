
// Networking (dev: 'http://10.0.2.2:1234/foxtrot-api')
export const API_URL = 'https://francescogorini.com/foxtrot-api';
export const WEBSOCKET_URL = 'wss://francescogorini.com/foxtrot-api/ws';

// Crypto
export const KeypairAlgorithm = {
  name: 'ECDH',
  namedCurve: 'P-384',
};
// Chunk size for encrypting/decrypting large payloads.
// Required due to web-crypto bug: https://github.com/webview-crypto/react-native-webview-crypto/issues/26
export const ChunkSize = 48 * 1024;

export const KeychainOpts = {
    authenticationPrompt: {
      title: 'Authentication required for Login',
      cancel: 'Cancel',
    },
};

// Style
export const PRIMARY = '#3672eb'; // '#199187';
export const SECONDARY = '#1b1c1f';
export const SECONDARY_LITE = '#aaa';
export const ACCENT = '#6227e3';
export const DARKHEADER = '#272a31';


export const VibratePattern = [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000];
