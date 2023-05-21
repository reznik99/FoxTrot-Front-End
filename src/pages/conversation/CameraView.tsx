import React, { useEffect, useState, useCallback, useRef } from "react"
import { View, Image, StyleSheet } from "react-native"
import { ActivityIndicator, Button } from 'react-native-paper'
import { Camera, useCameraDevices } from "react-native-vision-camera"
import { useDispatch } from "react-redux"
import { ThunkDispatch } from "redux-thunk"
import { AnyAction } from "redux";
import Toast from 'react-native-toast-message'
import RNFS from 'react-native-fs'

import { sendMessage } from "~/store/actions/user"
import { UserData } from "~/store/reducers/user"


interface IProps {
    navigation: any;
    route: {
        params: {
            data: { peer: UserData }
        }
    }
}

type AppDispatch = ThunkDispatch<any, any, AnyAction>

export default function CameraView(props: IProps) {

    const dispatch: AppDispatch = useDispatch()
    const camera = useRef<Camera>(null)
    const devices = useCameraDevices()
    const [device, setDevice] = useState(devices.back)
    const [isFront, setIsFront] = useState(false)
    const [hasPermission, setHasPermission] = useState(false)
    const [picture, setPicture] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        requestPermissions()
    }, [])

    useEffect(() => {
        setDevice(devices.back)
    }, [devices])

    const requestPermissions = useCallback(async () => {
        try {
            console.debug('Requesting camera permissions')
            const newCameraPermission = await Camera.requestCameraPermission()
            const newMicrophonePermission = await Camera.requestMicrophonePermission()

            if (newCameraPermission !== 'authorized' || newMicrophonePermission !== 'authorized') {
                Toast.show({
                    type: 'error',
                    text1: 'Camera permissions rejected',
                    text2: 'Unable to use phone\'s camera'
                })
                return false
            }
            setHasPermission(true)
            return true
        } catch (err) {
            console.error(err)
            return false
        }
    }, [devices])

    const swapCamera = useCallback(() => {
        setDevice(isFront ? devices.back : devices.front)
        setIsFront(!isFront)
    }, [devices, isFront])

    const takePic = useCallback(async () => {
        if (!camera.current) return
        const pic = await camera.current.takeSnapshot({ quality: 10 })
        setPicture(pic.path)
    }, [])

    const send = useCallback(async () => {
        setLoading(true)
        try {
            const rawPic = await RNFS.readFile(picture, 'base64')
            console.debug("Took picture:", rawPic.length.toLocaleString(), 'bytes')

            const toSend = JSON.stringify({
                type: "IMG",
                message: rawPic
            })
            const success = await dispatch(sendMessage(toSend, props?.route?.params?.data?.peer))
            if (success) props.navigation.goBack()
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }, [picture])

    return (
        <View style={styles.container}>
            <ActivityIndicator animating={!device || !hasPermission} style={{ position: "absolute" }} />

            {picture &&
                <>
                    <Image source={{ uri: `file://${picture}` }} style={{ width: '100%', height: '100%' }} />

                    <View style={styles.buttonContainer}>
                        <Button style={styles.button} icon='refresh' mode="contained" onPress={() => setPicture('')} color="white">
                            Take again
                        </Button>
                        <Button style={styles.button} icon="send" mode="contained" onPress={send} loading={loading} disabled={loading}>
                            Send
                        </Button>
                    </View>
                </>
            }

            {device && hasPermission && !picture
                ? <>
                    <Camera style={{ flex: 1 }}
                        ref={camera}
                        device={device}
                        isActive={true}
                        enableZoomGesture={true}
                    />
                    <View style={styles.buttonContainer}>
                        <Button style={styles.button} icon='camera-party-mode' mode="contained" onPress={swapCamera}>
                            Swap Camera
                        </Button>
                        <Button style={styles.button} icon='camera' mode="contained" onPress={takePic}>
                            Take pic
                        </Button>
                    </View>
                </>
                : undefined
            }
        </View>
    )
}


const styles = StyleSheet.create({
    container: {
        position: "absolute",
        width: '100%',
        height: '100%'
    }, buttonContainer: {
        position: "absolute",
        bottom: 30,
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-evenly'
    }, button: {
        borderRadius: 100
    }
})