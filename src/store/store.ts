import { createStore, combineReducers, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import userReducer from './reducers/user'

const rootReducer = combineReducers({
    userReducer: userReducer,
})
export const store = createStore(rootReducer, applyMiddleware(thunk))

// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof rootReducer> //ReturnType<typeof store.getState>
export type GetState = typeof store.getState
