import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RTCIceCandidate } from 'react-native-webrtc';
import { getAvatar } from '~/global/helper';
import { writeToStorage } from '~/global/storage';

export interface State {
    tokenValid: boolean;
    token: string;
    keys?: CryptoKeyPair;
    user_data: UserData;
    contacts: UserData[];
    conversations: Map<string, Conversation>;
    socketErr: string;
    socketConn?: WebSocket;
    caller?: UserData;
    callOffer?: RTCSessionDescription;
    callAnswer?: RTCSessionDescription;
    iceCandidates: RTCIceCandidate[];
    loading: boolean;
    refreshing: boolean;
    loginErr: string;
    signupErr: string;
}

export interface UserData {
    id: string | number,
    phone_no: string,
    pic?: string
    public_key?: string,
    session_key?: CryptoKey,
}

export interface Conversation {
    other_user: UserData,
    messages: message[]
}

export interface message {
    id: number;
    message: string;
    sent_at: string;
    seen: boolean;
    reciever: string;
    reciever_id: string | number;
    sender: string;
    sender_id: string | number;
}

const initialState: State = {
    tokenValid: false,
    token: '',
    keys: undefined,
    user_data: {
        id: '', phone_no: '', pic: '',
    },
    contacts: [],
    conversations: new Map(),
    socketErr: '',
    socketConn: undefined,
    caller: undefined,
    callOffer: undefined,
    callAnswer: undefined,
    iceCandidates: [],
    loading: false,
    refreshing: false,
    loginErr: '',
    signupErr: '',
};

export const userReducer = createSlice({
    name: 'user',
    initialState,
    reducers: {
        ADD_CONTACT_SUCCESS: (state, action: PayloadAction<UserData>) => {
            state.contacts.push(action.payload as UserData);
        },
        LOAD_CONTACTS: (state, action: PayloadAction<UserData[]>) => {
            state.contacts = action.payload
        },
        LOAD_CONVERSATIONS: (state, action: PayloadAction<Map<string, Conversation>>) => {
            state.conversations = action.payload
        },
        SYNC_FROM_STORAGE: (state, action: PayloadAction<{ user_data: UserData }>) => {
            state.user_data = action.payload.user_data
        },
        KEY_LOAD: (state, action: PayloadAction<CryptoKeyPair>) => {
            state.keys = action.payload
        },
        TOKEN_VALID: (state, action: PayloadAction<{ token: string, valid: boolean }>) => {
            state.token = action.payload.token
            state.tokenValid = action.payload.valid
        },
        LOGGED_IN: (state, action: PayloadAction<{ token: string, user_data: UserData }>) => {
            state.token = action.payload.token
            state.user_data = action.payload.user_data
            state.loginErr = ''
        },
        SIGNED_UP: (state, action: PayloadAction<UserData>) => {
            state.user_data = action.payload
        },
        LOGIN_ERROR_MSG: (state, action: PayloadAction<string>) => {
            state.loginErr = action.payload
        },
        SIGNUP_ERROR_MSG: (state, action: PayloadAction<string>) => {
            state.signupErr = action.payload
        },
        SET_LOADING: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload
        },
        SET_REFRESHING: (state, action: PayloadAction<boolean>) => {
            state.refreshing = action.payload
        },
        SEND_MESSAGE: (state, action: PayloadAction<{ sender: UserData, reciever: UserData, rawMessage: message }>) => {
            const reciever = action.payload.reciever;
            const message = action.payload.rawMessage as message;
            const converastionS = state.conversations.get(reciever.phone_no);
            if (converastionS) { converastionS.messages = [message, ...converastionS.messages]; }
            else {
                state.conversations.set(reciever.phone_no, {
                    other_user: reciever,
                    messages: [message],
                });
            }
        },
        RECV_MESSAGE: (state, action: PayloadAction<message>) => {
            const data = action.payload as message;
            const conversationR = state.conversations.get(data.sender);
            if (conversationR) { conversationR.messages = [data, ...conversationR.messages]; }
            else {
                state.conversations.set(data.sender, {
                    other_user: {
                        id: data.sender_id,
                        phone_no: data.sender,
                        ...state.contacts.find(con => con.phone_no === data.sender),
                        pic: getAvatar(data.sender_id),
                    },
                    messages: [data],
                });
            }
            // Save all conversations to local-storage so we don't reload them unnecessarily from the API
            writeToStorage(`messages-${state.user_data.id}-last-checked`, String(Date.now()));
            writeToStorage(`messages-${state.user_data.id}`, JSON.stringify(Array.from(state.conversations.entries())));
        },
        RECV_CALL_OFFER: (state, action: PayloadAction<{ offer: RTCSessionDescription, caller: UserData }>) => {
            state.callOffer = action.payload?.offer
            state.caller = action.payload?.caller
        },
        RECV_CALL_ANSWER: (state, action: PayloadAction<RTCSessionDescription>) => {
            state.callAnswer = action.payload
        },
        RECV_CALL_ICE_CANDIDATE: (state, action: PayloadAction<RTCIceCandidate>) => {
            state.iceCandidates.push(action.payload)
        },
        RESET_CALL_ICE_CANDIDATES: state => {
            state.iceCandidates = []
        },
        WEBSOCKET_CONNECT: (state, action: PayloadAction<WebSocket>) => {
            state.socketConn = action.payload
            state.socketErr = ''
        },
        WEBSOCKET_ERROR: (state, action: PayloadAction<string>) => {
            state.socketErr = action.payload
        },
        LOGOUT: state => {
            state = initialState
        },
    },
});

export default userReducer.reducer;

export const {
    ADD_CONTACT_SUCCESS,
    LOAD_CONTACTS,
    LOAD_CONVERSATIONS,
    SYNC_FROM_STORAGE,
    KEY_LOAD,
    TOKEN_VALID,
    LOGGED_IN,
    SIGNED_UP,
    LOGIN_ERROR_MSG,
    SIGNUP_ERROR_MSG,
    SET_LOADING,
    SET_REFRESHING,
    SEND_MESSAGE,
    RECV_MESSAGE,
    RECV_CALL_OFFER,
    RECV_CALL_ANSWER,
    RECV_CALL_ICE_CANDIDATE,
    RESET_CALL_ICE_CANDIDATES,
    WEBSOCKET_CONNECT,
    WEBSOCKET_ERROR,
    LOGOUT,
} = userReducer.actions

// function userReducer1(state = initialState, action: Action) {
//     let newState = { ...state };
//     switch (action.type) {
//         case 'ADD_CONTACT_SUCCESS':
//             return { ...state, contacts: [...state.contacts, action.payload as UserData] };
//         case 'LOAD_CONTACTS':
//             return { ...state, contacts: action.payload as UserData[] };
//         case 'LOAD_CONVERSATIONS':
//             return { ...state, conversations: action.payload as Map<string, Conversation> };
//         case 'SYNC_FROM_STORAGE':
//             return { ...state, user_data: action.payload.user_data as UserData };
//         case 'KEY_LOAD':
//             return { ...state, keys: action.payload as CryptoKeyPair };
//         case 'TOKEN_VALID':
//             return { ...state, token: action.payload.token, tokenValid: action.payload.valid as boolean };
//         case 'LOGGED_IN':
//             return { ...state, token: action.payload.token as string, user_data: action.payload.user_data as UserData, loginErr: '' };
//         case 'SIGNED_UP':
//             return { ...state, user_data: action.payload as UserData };
//         case 'LOGIN_ERROR_MSG':
//             return { ...state, loginErr: action.payload as string };
//         case 'SIGNUP_ERROR_MSG':
//             return { ...state, signupErr: action.payload as string };
//         case 'SET_LOADING':
//             return { ...state, loading: action.payload as boolean };
//         case 'SET_REFRESHING':
//             return { ...state, refreshing: action.payload as boolean };
//         case 'SEND_MESSAGE':
//             newState.conversations = new Map(state.conversations);
//             const reciever = action.payload.reciever;
//             const message = action.payload.rawMessage as message;
//             const converastionS = newState.conversations.get(reciever.phone_no);
//             if (converastionS) { converastionS.messages = [message, ...converastionS.messages]; }
//             else {
//                 newState.conversations.set(reciever.phone_no, {
//                     other_user: reciever,
//                     messages: [message],
//                 });
//             }
//             return newState;
//         case 'RECV_MESSAGE':
//             newState.conversations = new Map(state.conversations);
//             const data = action.payload as message;
//             const conversationR = newState.conversations.get(data.sender);
//             if (conversationR) { conversationR.messages = [data, ...conversationR.messages]; }
//             else {
//                 newState.conversations.set(data.sender, {
//                     other_user: {
//                         id: data.sender_id,
//                         phone_no: data.sender,
//                         ...newState.contacts.find(con => con.phone_no === data.sender),
//                         pic: getAvatar(data.sender_id),
//                     },
//                     messages: [data],
//                 });
//             }
//             // Save all conversations to local-storage so we don't reload them unnecessarily from the API
//             writeToStorage(`messages-${state.user_data.id}-last-checked`, String(Date.now()));
//             writeToStorage(`messages-${state.user_data.id}`, JSON.stringify(Array.from(newState.conversations.entries())));
//             return newState;
//         case 'RECV_CALL_OFFER':
//             return { ...state, callOffer: action.payload?.offer as RTCSessionDescription, caller: action.payload?.caller as UserData };
//         case 'RECV_CALL_ANSWER':
//             return { ...state, callAnswer: action.payload as RTCSessionDescription };
//         case 'RECV_CALL_ICE_CANDIDATE':
//             return { ...state, iceCandidates: [...state.iceCandidates, action.payload as RTCIceCandidate] };
//         case 'RESET_CALL_ICE_CANDIDATES':
//             return { ...state, iceCandidates: [] };
//         case 'WEBSOCKET_CONNECT':
//             return { ...state, socketConn: action.payload as WebSocket, socketErr: '' };
//         case 'WEBSOCKET_ERROR':
//             return { ...state, socketErr: action.payload as string };
//         case 'LOGOUT':
//             return { ...initialState };
//         default:
//             return state;
//     }
// }
