
const initialState = {} // do i need this?

function exampleReducer(state = initialState, action) {
    switch (action.type) {
        case "GET_SOMETHING":
            return { ...state, something: action.payload }
        default:
            return state
    }
}
export default exampleReducer