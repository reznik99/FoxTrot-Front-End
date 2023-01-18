import React, { useEffect, useState, useCallback, useRef } from "react"
import { View, Image } from "react-native"
import { ActivityIndicator, Button } from 'react-native-paper'
import Toast from 'react-native-toast-message'
import { Camera, useCameraDevices } from "react-native-vision-camera"


export default function CameraView(props: { navigation: any }) {

    const camera = useRef<Camera>(null)
    const devices = useCameraDevices()
    const device = devices.back
    const [hasPermission, setHasPermission] = useState(false)
    const [picture, setPicture] = useState('')

    useEffect(() => {
        requestPermissions()

    }, [])

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
        }
    }, [devices])

    const takePic = useCallback(async () => {
        if (!camera.current) return

        const pic = await camera.current.takeSnapshot()
        setPicture(pic.path)
        console.debug('took pic: ', pic.path)
    }, [])

    return (
        <View style={{ position: "absolute", width: '100%', height: '100%' }}>
            <ActivityIndicator animating={!device || !hasPermission} style={{position: "absolute"}} />

            {picture && 
                <>
                    <Image source={{ uri: `file://${picture}` }} style={{width: '100%', height: '100%'}}/>

                    <View style={{ position: "absolute", bottom: 30, width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'space-evenly' }}>
                        <Button style={{ borderRadius: 100 }} color="white"
                            icon='refresh' mode="contained" onPress={() => setPicture('')}>
                            Take again
                        </Button>
                        <Button style={{ borderRadius: 100 }}
                            icon="arrow-right" mode="contained" onPress={() => setPicture('')}>
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
                    <View style={{ position: "absolute", bottom: 30, width: '100%', display: 'flex', alignItems: 'center' }}>
                        <Button style={{ borderRadius: 100 }}
                            icon='camera' mode="contained" onPress={takePic}>
                            Take pic
                        </Button>
                    </View>
                </>
                : undefined
            }
        </View>
    )
}