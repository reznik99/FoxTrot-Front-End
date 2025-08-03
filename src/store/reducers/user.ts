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
    reciever_id: number;
    sender: string;
    sender_id: number;
}

export interface Action {
    type: string,
    payload: any
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

function userReducer(state = initialState, action: Action) {
    let newState = { ...state };
    switch (action.type) {
        case 'ADD_CONTACT_SUCCESS':
            return { ...state, contacts: [...state.contacts, action.payload as UserData] };
        case 'LOAD_CONTACTS':
            return { ...state, contacts: action.payload as UserData[] };
        case 'LOAD_CONVERSATIONS':
            return { ...state, conversations: action.payload as Map<string, Conversation> };
        case 'SYNC_FROM_STORAGE':
            return { ...state, user_data: action.payload.user_data as UserData };
        case 'KEY_LOAD':
            return { ...state, keys: action.payload as CryptoKeyPair };
        case 'TOKEN_VALID':
            return { ...state, token: action.payload.token, tokenValid: action.payload.valid as boolean };
        case 'LOGGED_IN':
            return { ...state, token: action.payload.token as string, user_data: action.payload.user_data as UserData, loginErr: '' };
        case 'SIGNED_UP':
            return { ...state, user_data: action.payload as UserData };
        case 'LOGIN_ERROR_MSG':
            return { ...state, loginErr: action.payload as string };
        case 'SIGNUP_ERROR_MSG':
            return { ...state, signupErr: action.payload as string };
        case 'SET_LOADING':
            return { ...state, loading: action.payload as boolean };
        case 'SET_REFRESHING':
            return { ...state, refreshing: action.payload as boolean };
        case 'SEND_MESSAGE':
            newState.conversations = new Map(state.conversations);
            const reciever = action.payload.reciever;
            const message = action.payload.rawMessage as message;
            const converastionS = newState.conversations.get(reciever.phone_no);
            if (converastionS) {converastionS.messages = [message, ...converastionS.messages];}
            else {
                newState.conversations.set(reciever.phone_no, {
                    other_user: reciever,
                    messages: [message],
                });
            }
            return newState;
        case 'RECV_MESSAGE':
            newState.conversations = new Map(state.conversations);
            const data = action.payload as message;
            const conversationR = newState.conversations.get(data.sender);
            if (conversationR) {conversationR.messages = [data, ...conversationR.messages];}
            else {
                newState.conversations.set(data.sender, {
                    other_user: {
                        id: data.sender_id,
                        phone_no: data.sender,
                        ...newState.contacts.find(con => con.phone_no === data.sender),
                        pic: getAvatar(data.sender_id),
                    },
                    messages: [data],
                });
            }
            // Save all conversations to local-storage so we don't reload them unnecessarily from the API
            writeToStorage(`messages-${state.user_data.id}-last-checked`, String(Date.now()));
            writeToStorage(`messages-${state.user_data.id}`, JSON.stringify(Array.from(newState.conversations.entries())));
            return newState;
        case 'RECV_CALL_OFFER':
            return { ...state, callOffer: action.payload?.offer as RTCSessionDescription, caller: action.payload?.caller as UserData };
        case 'RECV_CALL_ANSWER':
            return { ...state, callAnswer: action.payload as RTCSessionDescription };
        case 'RECV_CALL_ICE_CANDIDATE':
            return { ...state, iceCandidates: [...state.iceCandidates, action.payload as RTCIceCandidate] };
        case 'RESET_CALL_ICE_CANDIDATES':
            return { ...state, iceCandidates: [] };
        case 'WEBSOCKET_CONNECT':
            return { ...state, socketConn: action.payload as WebSocket, socketErr: '' };
        case 'WEBSOCKET_ERROR':
            return { ...state, socketErr: action.payload as string };
        case 'LOGOUT':
            return { ...initialState };
        default:
            return state;
    }
}
export default userReducer;
