
const initialState = {
    tokenValid: false,
    token: '',
    phone_no: '',
}

function userReducer(state = initialState, action) {
    switch (action.type) {
        case "LOAD_CONTACTS":
            return { ...state, contacts: action.payload }
        case "LOAD_CONVERSATIONS":
            return { ...state, conversations: action.payload }
        case "SYNC_FROM_STORAGE":
            return { ...state, keys: action.payload.keys, token: action.payload.token, phone_no: action.payload.phone_no, }
        case "TOKEN_VALID":
            return { ...state, tokenValid: action.payload }
        case "LOGGED_IN":
            return { ...state, token: action.payload.token, phone_no: action.payload.phone_no }
        case "ERROR_MSG":
            return { ...state, errorMsg: action.payload }
        case "SET_LOADING":
            return { ...state, loading: action.payload }
        default:
            return state
    }
}
export default userReducer