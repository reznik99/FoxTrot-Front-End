import axios, { AxiosError } from 'axios';
import * as Keychain from 'react-native-keychain';
import Toast from 'react-native-toast-message';

import { API_URL } from '~/global/variables';
import { AppDispatch } from '../store';
import { getAvatar } from '~/global/helper';
import { deleteFromStorage, writeToStorage } from '~/global/storage';

export function logIn(username: string, password: string) {
    return async (dispatch: AppDispatch) => {
        if (username === '' || password === '') {
            dispatch({ type: 'LOGIN_ERROR_MSG', payload: 'Textfields cannot be blank!' });
            return false;
        }
        try {
            dispatch({ type: 'SET_LOADING', payload: true });

            const res = await axios.post(`${API_URL}/login`, {
                phone_no: username,
                password: password,
            });


            console.debug('Saving user in storage');
            // Save user_data in phone storage
            const user_data = { pic: getAvatar(res.data.user_data?.id), ...res.data.user_data };
            await writeToStorage('user_data', JSON.stringify(user_data));

            // Save password and JWT auth token in secure storage
            const secrets = {
                password: password,
                auth_token: res.data.token,
                time: Date.now(),
            };
            await Keychain.setGenericPassword(username, JSON.stringify(secrets), {
                storage: Keychain.STORAGE_TYPE.AES_GCM,
                accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
                server: API_URL,
                service: `${username}-credentials`,
            });

            // Save data in redux store
            dispatch({
                type: 'LOGGED_IN',
                payload: {
                    token: res.data.token,
                    user_data: user_data,
                },
            });

            return true;
        }
        catch (err: any) {
            console.error('Error logging in:', err);
            dispatch({ type: 'LOGIN_ERROR_MSG', payload: err.response?.data?.message || err.message });
            return false;
        }
        finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };
}

export function signUp(username: string, password: string, re_password: string) {
    return async (dispatch: AppDispatch): Promise<boolean> => {
        if (!username || !password || !re_password) {
            dispatch({ type: 'SIGNUP_ERROR_MSG', payload: 'Textfields cannot be blank!' });
            return false;
        } else if (password !== re_password) {
            dispatch({ type: 'SIGNUP_ERROR_MSG', payload: 'Passwords do not match!' });
            return false;
        } else if (username.length <= 3) {
            dispatch({ type: 'SIGNUP_ERROR_MSG', payload: 'Username too short!' });
            return false;
        }
        dispatch({ type: 'SIGNUP_ERROR_MSG', payload: '' });
        try {
            dispatch({ type: 'SET_LOADING', payload: true });

            const response = await axios.post(`${API_URL}/signup`, {
                phone_no: username,
                password: password,
            });
            // Save data in phone storage
            await writeToStorage('user_data', JSON.stringify(response.data?.user_data || { phone_no: username }));
            dispatch({ type: 'SIGNED_UP', payload: response.data?.user_data || { phone_no: username } });

            Toast.show({
                type: 'success',
                text1: 'Signed up successfully',
                text2: `As ${username}`,
                visibilityTime: 6000,
            });
            return true;
        }
        catch (err: any) {
            console.error('Error signing up:', err);
            dispatch({ type: 'SIGNUP_ERROR_MSG', payload: err.response?.data?.message || err.message });
            return false;
        }
        finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };
}

export function logOut(navigation: any) {
    return async (dispatch: AppDispatch): Promise<void> => {
        console.debug('Logging out');
        // Clear redux state
        dispatch({ type: 'LOGOUT', payload: undefined });
        // Clear storage
        await deleteFromStorage('user_data');
        await deleteFromStorage('auth_token');

        navigation.replace('Login', { data: { loggedOut: true } });
    };
}

export function setupInterceptors(navigation: any) {
    axios.interceptors.response.use(
        (response) => response,
        (error: AxiosError) => {
            if (error.response?.status === 403) {
                // TODO: Re-authenticate instead of signing out
                navigation.replace('Login');
            }
            return Promise.reject(error);
        }
    );
}

