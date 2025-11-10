import { configureStore } from '@reduxjs/toolkit';
import userReducer from './reducers/user';
import { enableMapSet } from 'immer'
// Allow storing Map and Set in redux state
enableMapSet();

export const store = configureStore({
    reducer: {
        userReducer: userReducer
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type GetState = typeof store.getState
