import { WEBSOCKET_URL } from '~/global/variables'
import PushNotification from 'react-native-push-notification'
import { AppDispatch, GetState } from '../store'


interface SocketData {
    cmd: 'MSG' | 'CALL';
    data: SocketMessage;
}

interface SocketMessage {
    sender: string;
    sender_id: number;
    message: string;
    sent_at: number;
    seen: boolean;
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
                console.debug("Websocket RECV: ", event.data)
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

function handleSocketMessage(data: any, dispatch: AppDispatch) {
    try {
        const parsedData = JSON.parse(data) as SocketData
        switch(parsedData.cmd) {
            case "MSG": 
                dispatch({ type: "RECV_MESSAGE", payload: parsedData.data })
                PushNotification.localNotification({
                    channelId: 'Messages',
                    title: `Message from ${parsedData.data.sender}`,
                    message: parsedData.data.message,
                    when: parsedData.data.sent_at,
                    visibility: "public",
                    picture: `https://robohash.org/${parsedData.data.sender_id}`
                })
                break;
            case "CALL":
                // TODO:
                console.debug("Websocket CALL Recieved: ", parsedData)
        }
    } catch (err) {
        console.error("Websocket RECV error: ", err)
    }
}