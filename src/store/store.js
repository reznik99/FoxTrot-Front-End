import { createStore, combineReducers, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import exampleReducer from './reducers/user'

const rootReducer = combineReducers({
    exampleReducer,
})
export const store = createStore(rootReducer, applyMiddleware(thunk))