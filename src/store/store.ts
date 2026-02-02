import { configureStore } from '@reduxjs/toolkit';
import { enableMapSet } from 'immer';

import { userSlice } from './reducers/user';

// Allow storing Map and Set in redux state
enableMapSet();

export const store = configureStore({
    reducer: {
        userReducer: userSlice.reducer,
    },
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
});

type AppStore = typeof store;
export type GetState = AppStore['getState'];
export type AppDispatch = AppStore['dispatch'];
export type RootState = ReturnType<GetState>;
