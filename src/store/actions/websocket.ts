import { WEBSOCKET_URL } from '~/global/variables'
import PushNotification from 'react-native-push-notification'
import { AppDispatch, GetState } from '../store'


export interface SocketData {
    cmd: 'MSG' | 'CALL_OFFER' | 'CALL_ICE_CANDIDATE' | 'CALL_ANSWER';
    data: SocketMessage;
}

export interface SocketMessage {
    sender: string;
    sender_id: string;
    reciever: string;
    reciever_id: string;
    message?: string;
    sent_at?: number;
    seen?: boolean;
    offer?: any;
    answer?: any;
    candidate?: unknown;
}

export function initializeWebsocket() {
    return async (dispatch: AppDispatch, getState: GetState) => {
        try {
            dispatch({ type: "SET_LOADING", payload: true })

            let state = getState().userReducer
            if (!state.token) throw new Error("Token is not present. Re-auth required")

            // Already opened so return early
            if (state.socketConn) state.socketConn.close()
            
            // Enstablish websocket
            const socketConn = new WebSocket(`${WEBSOCKET_URL}?token=${state.token}`)
            socketConn.onopen = () => {
                console.debug("Socket to server opened succesfully")
                PushNotification.createChannel(
                    {
                        channelId: 'Messages',
                        channelName: 'Notifications for incoming messages',
                        channelDescription: 'Notifications for incoming messages',
                    },
                    () => { },
                )
            }
            socketConn.onclose = () => {
                console.debug("Websocket connection has been closed gracefully")
            }
            socketConn.onerror = (err) => {
                console.error("Websocket err:", err)
                dispatch({ type: "WEBSOCKET_ERROR", payload: err })
            }
            socketConn.onmessage = (event) => {
                handleSocketMessage(event.data, dispatch)
            }
            dispatch({ type: "WEBSOCKET_CONNECT", payload: socketConn })
        } catch (err) {
            console.error('Error establishing websocket: ', err)
        } finally {
            dispatch({ type: "SET_LOADING", payload: false })
        }
    }
}

export function destroyWebsocket() {
    return async (dispatch: AppDispatch, getState: GetState) => {
        try {
            let state = getState().userReducer

            // Close existing socket 
            if (state.socketConn) state.socketConn.close()

            dispatch({ type: "WEBSOCKET_CONNECT", payload: null })
        } catch (err) {
            console.warn('Error destroying websocket: ', err)
        }
    }
}

export function resetCallState() {
    return async (dispatch: AppDispatch) => {
        try {

            dispatch({ type: "RECV_CALL_ICE_CANDIDATE", payload: undefined })
            dispatch({ type: "RECV_CALL_ANSWER", payload: undefined })
            dispatch({ type: "RECV_CALL_OFFER", payload: undefined })
        } catch (err) {
            console.warn('Error resetCallState: ', err)
        }
    }
}

function handleSocketMessage(data: any, dispatch: AppDispatch) {
    try {
        const parsedData = JSON.parse(data) as SocketData
        switch(parsedData.cmd) {
            case "MSG": 
                dispatch({ type: "RECV_MESSAGE", payload: parsedData.data })
                PushNotification.localNotification({
                    channelId: 'Messages',
                    title: `Message from ${parsedData.data.sender}`,
                    message: parsedData.data?.message || '',
                    when: parsedData.data.sent_at,
                    visibility: "public",
                    picture: `https://robohash.org/${parsedData.data.sender_id}`
                })
                break;
            case "CALL_OFFER":
                dispatch({ type: "RECV_CALL_OFFER", payload: parsedData.data?.offer })
                console.debug("Websocket CALL_OFFER Recieved: ", parsedData.data.sender)
            case "CALL_ANSWER":
                dispatch({ type: "RECV_CALL_ANSWER", payload: parsedData.data?.answer })
                console.debug("Websocket CALL_ANSWER Recieved: ", parsedData.data.sender)
            case "CALL_ICE_CANDIDATE":
                dispatch({ type: "RECV_CALL_ICE_CANDIDATE", payload: parsedData.data?.candidate })
                console.debug("Websocket RECV_CALL_ICE_CANDIDATE Recieved: ", parsedData.data.sender)
        }
    } catch (err) {
        console.error("Websocket RECV error: ", err)
    }
}