
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
        case "ADDING_CONTACT":
            return { ...state, adding_contact: action.payload }
        case "ADD_CONTACT_FAILURE":
            return { ...state, failed_contact: action.payload }
        case "ADD_CONTACT_SUCCESS":
            return { ...state, contacts: [...state.contacts, action.payload], new_contact: action.payload }
        case "LOAD_CONTACTS":
            return { ...state, contacts: action.payload }
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
            newState = { ...state }
            message = action.payload
            newState.conversations.forEach(convo => {
                if (convo.other_user.phone_no === message.reciever) {
                    convo.messages.push(message)
                }
            });
            return newState
        case "RECV_MESSAGE":
            newState = { ...state }
            message = action.payload
            newState.conversations.forEach(convo => {
                if (convo.other_user.phone_no === message.sender) {
                    convo.messages.push(message)
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