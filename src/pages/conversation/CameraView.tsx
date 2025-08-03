import React, { useEffect, useState, useCallback, useRef } from 'react'
import { View, Image, StyleSheet } from 'react-native'
import { ActivityIndicator, Button, Text } from 'react-native-paper'
import { Camera, useCameraDevices } from 'react-native-vision-camera'
import Toast from 'react-native-toast-message'
import RNFS from 'react-native-fs'
import { ThunkDispatch } from 'redux-thunk'
import { useDispatch } from 'react-redux'
import { AnyAction } from 'redux'

import { sendMessage } from '~/store/actions/user'
import { UserData } from '~/store/reducers/user'
import { SECONDARY, SECONDARY_LITE } from '~/global/variables'
import { getCameraAndMicrophonePermissions } from '~/global/permissions'

interface IProps {
    navigation: any;
    route: {
        params: {
            data: {
                peer: UserData;
                picturePath?: string;
            },
        }
    }
}

type AppDispatch = ThunkDispatch<any, any, AnyAction>

export default function CameraView(props: IProps) {

    const dispatch = useDispatch<AppDispatch>()
    const camera = useRef<Camera>(null)
    const devices = useCameraDevices()
    const [device, setDevice] = useState(devices[0])
    const [isFront, setIsFront] = useState(false)
    const [hasPermission, setHasPermission] = useState(false)
    const [picture, setPicture] = useState(props.route.params?.data?.picturePath || '')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (props.route.params?.data?.picturePath) return
        requestPermissions()
    }, [])

    useEffect(() => {
        setDevice(devices[0])
    }, [devices])

    const requestPermissions = useCallback(async () => {
        try {
            console.debug('Requesting camera permissions')
            const permission = await getCameraAndMicrophonePermissions()
            if (!permission) {
                Toast.show({
                    type: 'error',
                    text1: 'Camera permissions denied',
                    text2: 'Unable to use phone\'s camera'
                })
                return false
            }
            setHasPermission(true)
            return true
        } catch (err) {
            console.error('Error requesting camera permissions:', err)
            return false
        }
    }, [])

    const reset = useCallback(() => {
        setPicture('')
        if (!hasPermission) requestPermissions()
    }, [hasPermission])

    const swapCamera = useCallback(() => {
        setDevice(isFront ? devices[0] : devices[1])
        setIsFront(!isFront)
    }, [devices, isFront])

    const takePic = useCallback(async () => {
        if (!camera.current) return
        const pic = await camera.current.takeSnapshot({ quality: 30 })
        setPicture(`file://${pic.path}`)
    }, [camera])

    const send = useCallback(async () => {
        setLoading(true)
        try {
            const rawPic = await RNFS.readFile(picture, 'base64')
            console.debug('Took picture:', rawPic.length.toLocaleString(), 'bytes')

            const toSend = JSON.stringify({
                type: 'IMG',
                message: rawPic
            })

            const success = await dispatch(sendMessage(toSend, props?.route?.params?.data?.peer))
            if (success) props.navigation.goBack()
        } catch (err) {
            console.error('Error sending image:', err)
        } finally {
            setLoading(false)
        }
    }, [picture])

    return (
        <View style={styles.container}>
            {!device && !picture &&
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size='large' />
                </View>
            }
            { device && !picture && !hasPermission && 
                <View style={styles.loaderContainer}>
                    <Text variant='titleLarge'>Permission to use camera denied</Text>
                </View>
            }

            {picture &&
                <>
                    <Image source={{ uri: picture }} style={{ width: '100%', height: '100%' }} resizeMode='contain'/>

                    <View style={styles.buttonContainer}>
                        <Button style={styles.button} color={SECONDARY_LITE} icon='refresh' mode='contained' onPress={reset}>
                            Take again
                        </Button>
                        <Button style={styles.button} icon='send' mode='contained' onPress={send} loading={loading} disabled={loading}>
                            Send
                        </Button>
                    </View>
                </>
            }

            {device && hasPermission && !picture &&
                <>
                    <Camera style={{ flex: 1 }}
                        ref={camera}
                        device={device}
                        isActive={true}
                        enableZoomGesture={true}
                    />
                    <View style={styles.buttonContainer}>
                        <Button style={styles.button} color={SECONDARY_LITE} icon='camera-party-mode' mode='contained' onPress={swapCamera}>
                            Swap Camera
                        </Button>
                        <Button style={styles.button} icon='camera' mode='contained' onPress={takePic}>
                            Take pic
                        </Button>
                    </View>
                </>
            }
        </View>
    )
}


const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        backgroundColor: SECONDARY
    }, loaderContainer: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        justifyContent: 'center'
    }, buttonContainer: {
        position: 'absolute',
        bottom: 30,
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-evenly'
    }, button: {
        borderRadius: 100
    }
})