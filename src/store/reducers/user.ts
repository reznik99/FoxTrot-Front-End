
export interface State {
    tokenValid: boolean,
    token: string,
    keys?: CryptoKeyPair,
    user_data: UserData,
    contacts: UserData[],
    conversations: Map<string, Conversation>
}

export interface UserData {
    id: string,
    phone_no: string,
    pic?: string
    publicKey?: string,
    sessionKey?: CryptoKey,
}

export interface Conversation {
    other_user: UserData,
    messages: string[]
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
        id: '', phone_no: ''
    },
    contacts: [],
    conversations: new Map()
}

function userReducer(state = initialState, action: Action) {
    let newState = {...state}
    let message
    switch (action.type) {
        case "ADDING_CONTACT":
            return { ...state, adding_contact: action.payload }
        case "ADD_CONTACT_SUCCESS":
            return { ...state, contacts: [...state.contacts, action.payload] as UserData[] }
        case "LOAD_CONTACTS":
            return { ...state, contacts: action.payload as UserData[] }
        case "LOAD_CONVERSATIONS":
            return { ...state, conversations: action.payload as Map<string, Conversation> }
        case "SYNC_FROM_STORAGE":
            return { ...state, token: action.payload.token, user_data: action.payload.user_data as UserData }
        case "KEY_LOAD":
            return { ...state, keys: action.payload as CryptoKeyPair }
        case "TOKEN_VALID":
            return { ...state, tokenValid: action.payload }
        case "LOGGED_IN":
            return { ...state, token: action.payload.token, user_data: action.payload.user_data as UserData, loginErr: "" }
        case "LOGIN_ERROR_MSG":
            return { ...state, loginErr: action.payload }
        case "SIGNUP_ERROR_MSG":
            return { ...state, signupErr: action.payload }
        case "SET_LOADING":
            return { ...state, loading: action.payload }
        case "SET_REFRESHING":
            return { ...state, refreshing: action.payload }
        case "SEND_MESSAGE":
            const reciever = action.payload.reciever
            message = action.payload.rawMessage
            const converastionS = newState.conversations.get(reciever.phone_no)
            if ( converastionS ) converastionS.messages.push(message) 
            else {
                newState.conversations.set(reciever.phone_no, {
                    other_user: reciever,
                    messages: [message]
                })
            }
            return newState
        case "RECV_MESSAGE":
            const data = action.payload
            const conversationR = newState.conversations.get(data.sender)
            console.log(conversationR)

            if ( conversationR ) conversationR.messages.push(data) 
            else {
                newState.conversations.set(data.sender, {
                    other_user: {id: data.sender_id, phone_no: data.sender, ...newState.contacts.find(con => con.phone_no === data.sender)},
                    messages: [data]
                })
            }
            return newState
        case "WEBSOCKET_CONNECT":
            return { ...state, socketConn: action.payload, socketErr: '' }
        case "WEBSOCKET_ERROR":
            return { ...state, socketErr: action.payload }
        case "LOGOUT":
            return {...initialState, user_data: state.user_data}
        default:
            return state
    }
}
export default userReducer