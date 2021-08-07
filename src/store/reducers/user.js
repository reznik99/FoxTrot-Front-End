
const initialState = {
    tokenValid: false,
    token: '',
    keys: {},
    phone_no: '',
    contacts: [],
    conversations: []
}

function userReducer(state = initialState, action) {
    switch (action.type) {
        case "NEW_CONTACT":
            return { ...state, contacts: [...state.contacts, action.payload] }
        case "LOAD_CONTACTS":
            return { ...state, contacts: action.payload }
        case "LOAD_CONVERSATIONS":
            return { ...state, conversations: action.payload }
        case "SYNC_FROM_STORAGE":
            return { ...state, keys: action.payload.keys, token: action.payload.token, phone_no: action.payload.phone_no }
        case "KEY_GEN":
            return { ...state, keys: action.payload }
        case "TOKEN_VALID":
            return { ...state, tokenValid: action.payload }
        case "LOGGED_IN":
            return { ...state, token: action.payload.token, phone_no: action.payload.phone_no }
        case "LOGIN_ERROR_MSG":
            return { ...state, loginErr: action.payload }
        case "SIGNUP_ERROR_MSG":
            return { ...state, signupErr: action.payload }
        case "SET_LOADING":
            return { ...state, loading: action.payload }
        case "SET_REFRESHING":
            return { ...state, refreshing: action.payload }
        case "SEND_MESSAGE":
            const newState = { ...state }
            const message = action.payload
            newState.conversations.forEach(convo => {
                if (convo.other_user.phone_no === message.reciever) {
                    convo.messages.push(message)
                }
            });
            return newState
        default:
            return state
    }
}
export default userReducer