
export interface State {
    tokenValid: boolean,
    token: string,
    keys?: CryptoKeyPair,
    user_data?: UserData,
    contacts: UserData[],
    conversations: Array<any>
}

export interface UserData {
    id: string,
    phone_no: string
}

export interface Action {
    type: string,
    payload: any
}

const initialState: State = {
    tokenValid: false,
    token: '',
    keys: undefined,
    user_data: undefined,
    contacts: [],
    conversations: []
}

function userReducer(state = initialState, action: Action) {
    let newState = {...state}
    switch (action.type) {
        case "ADDING_CONTACT":
            return { ...state, adding_contact: action.payload }
        case "ADD_CONTACT_FAILURE":
            return { ...state, failed_contact: action.payload }
        case "ADD_CONTACT_SUCCESS":
            return { ...state, contacts: [...state.contacts, action.payload], new_contact: action.payload }
        case "LOAD_CONTACTS":
            return { ...state, contacts: action.payload as UserData[] }
        case "LOAD_CONVERSATIONS":
            return { ...state, conversations: action.payload }
        case "SYNC_FROM_STORAGE":
            return { ...state, token: action.payload.token, user_data: action.payload.user_data }
        case "KEY_LOAD":
            return { ...state, keys: action.payload }
        case "TOKEN_VALID":
            return { ...state, tokenValid: action.payload }
        case "LOGGED_IN":
            return { ...state, token: action.payload.token, user_data: action.payload.user_data, loginErr: "" }
        case "LOGIN_ERROR_MSG":
            return { ...state, loginErr: action.payload }
        case "SIGNUP_ERROR_MSG":
            return { ...state, signupErr: action.payload }
        case "SET_LOADING":
            return { ...state, loading: action.payload }
        case "SET_REFRESHING":
            return { ...state, refreshing: action.payload }
        case "SEND_MESSAGE":
            newState.conversations.forEach(convo => {
                if (convo.other_user.phone_no === action.payload.reciever) {
                    convo.messages.push(action.payload)
                }
            });
            return newState
        case "RECV_MESSAGE":
            newState.conversations.forEach(convo => {
                if (convo.other_user.phone_no === action.payload.sender) {
                    convo.messages.push(action.payload)
                }
            });
            return newState
        case "WEBSOCKET_CONNECT":
            return { ...state, socketConn: action.payload, socketErr: '' }
        case "WEBSOCKET_ERROR":
            return { ...state, socketErr: action.payload }
        default:
            return state
    }
}
export default userReducer