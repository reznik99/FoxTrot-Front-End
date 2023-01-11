
// Networking (dev: 'http://10.0.2.2:1234/foxtrot-api')
export const API_URL = 'https://francescogorini.com/foxtrot-api';
export const WEBSOCKET_URL = 'wss://francescogorini.com/foxtrot-api/ws';

// Crypto
export const KeypairAlgorithm = {
  name: 'ECDH',
  namedCurve: 'P-384'
}

export const KeychainOpts = {
    authenticationPrompt: {
      title: 'Authentication required',
      subtitle: 'Subtitle',
      description: 'Some descriptive text',
      cancel: 'Cancel',
    },
};

// Style
export const PRIMARY = '#199187';
export const SECONDARY = '#333';
export const SECONDARY_LITE = '#aaa';
export const ACCENT = '#6227e3';


export const VibratePattern = [250, 500, 250, 500, 250, 500, 250, 500, 250, 500, 250, 500, 250, 500, 250, 500]