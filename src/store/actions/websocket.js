import { WEBSOCKET_URL } from '../../global/variables'
import PushNotification from 'react-native-push-notification'

export function initializeWebsocket() {
    return async (dispatch, getState) => {
        try {
            dispatch({ type: "SET_LOADING", payload: true })

            let state = getState().userReducer
            if (!state.token) throw new Error("Token is not present. Re-auth required")

            // Close existing socket 
            if (state.socketConn)
                state.socketConn.close()
            // Enstablish websocket
            const socketConn = new WebSocket(`${WEBSOCKET_URL}?token=${state.token}`)
            socketConn.onopen = () => {
                console.log("Socket to server opened succesfully")
            }
            socketConn.onclose = () => {
                console.log("Websocket connection has been closed gracefully")
            }
            socketConn.onerror = (err) => {
                console.log(err)
                dispatch({ type: "WEBSOCKET_ERROR", payload: err })
            }
            socketConn.onmessage = (event) => {
                console.log(`Data from server: ${event.data}`)
                try {
                    const message = JSON.parse(event.data)
                    dispatch({ type: "RECV_MESSAGE", payload: message })
                    PushNotification.createChannel(
                        {
                            channelId: 'Messages',
                            channelName: 'Notifications for incoming messages',
                            channelDescription: 'Notifications for incoming messages',
                        },
                        () => { },
                    )
                    PushNotification.localNotification({
                        channelId: 'Messages',
                        title: `🔔 Message from ${message.sender}`,
                        message: message.message,
                        when: message.sent_at,
                        visibility: "public",
                        picture: `https://robohash.org/${message.sender}`
                    })
                } catch (err) {
                    console.log(err)
                }
            }
            dispatch({ type: "WEBSOCKET_CONNECT", payload: socketConn })
        } catch (err) {
            console.log(`Error establishing websocket: ${err}`)
        } finally {
            dispatch({ type: "SET_LOADING", payload: false })
        }
    }
}

export function destroyWebsocket() {
    return async (dispatch, getState) => {
        try {

            let state = getState().userReducer
            if (!state.token) throw new Error("Token is not present. Re-auth required")

            // Close existing socket 
            if (state.socketConn)
                state.socketConn.close()

            dispatch({ type: "WEBSOCKET_CONNECT", payload: null })
        } catch (err) {
            console.log(`Error establishing websocket: ${err}`)
        }
    }
}