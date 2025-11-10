import { configureStore } from '@reduxjs/toolkit';
import userReducer from './reducers/user';

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
