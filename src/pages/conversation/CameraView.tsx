import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ActivityIndicator, Button, Text } from 'react-native-paper';
import { Camera, Templates, useCameraDevices, useCameraFormat } from 'react-native-vision-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { View, Image, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import { useDispatch } from 'react-redux';
import RNFS from 'react-native-fs';

import { getCameraAndMicrophonePermissions } from '~/global/permissions';
import { SECONDARY, SECONDARY_LITE } from '~/global/variables';
import { sendMessage } from '~/store/actions/user';
import { HomeStackParamList } from '~/../App';
import { AppDispatch } from '~/store/store';

export default function CameraView(props: StackScreenProps<HomeStackParamList, 'CameraView'>) {

    const dispatch = useDispatch<AppDispatch>();
    const edgeInsets = useSafeAreaInsets();
    const camera = useRef<Camera>(null);
    const devices = useCameraDevices();
    const [device, setDevice] = useState(devices.find(dev => dev.position === 'front') || devices[0]);
    const format = useCameraFormat(device, Templates.Snapchat);
    const [hasPermission, setHasPermission] = useState(false);
    const [picture, setPicture] = useState(props.route.params?.data?.picturePath || '');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (props.route.params?.data?.picturePath) { return; }
        requestPermissions();
    }, []);

    const requestPermissions = useCallback(async () => {
        try {
            console.debug('Requesting camera permissions');
            const permission = await getCameraAndMicrophonePermissions();
            if (!permission) {
                Toast.show({
                    type: 'error',
                    text1: 'Camera permissions denied',
                    text2: 'Unable to use phone\'s camera',
                });
                return false;
            }
            setHasPermission(true);
            return true;
        } catch (err) {
            console.error('Error requesting camera permissions:', err);
            return false;
        }
    }, []);

    const reset = useCallback(() => {
        setPicture('');
        if (!hasPermission) { requestPermissions(); }
    }, [hasPermission, requestPermissions]);

    const swapCamera = useCallback(() => {
        const newDevice = device.position === 'front'
            ? devices.find(dev => dev.position === 'back')
            : devices.find(dev => dev.position === 'front');

        setDevice(newDevice!);
    }, [device, devices]);

    const takePic = useCallback(async () => {
        if (!camera.current) { return; }
        setLoading(true);
        try {
            const pic = await camera.current.takePhoto({ enableAutoDistortionCorrection: true });
            setPicture(`file://${pic.path}`);
        } catch (err) {
            console.error('Error taking image:', err);
        } finally {
            setLoading(false);
        }
    }, [camera]);

    const send = useCallback(async () => {
        setLoading(true);
        try {
            const rawPic = await RNFS.readFile(picture, 'base64');
            console.debug('Took picture:', rawPic.length.toLocaleString(), 'bytes');

            const toSend = JSON.stringify({
                type: 'IMG',
                message: rawPic,
            });

            const res = await dispatch(sendMessage({ message: toSend, to_user: props.route.params?.data?.peer }));
            if (res.payload) { props.navigation.goBack(); }
        } catch (err) {
            console.error('Error sending image:', err);
        } finally {
            setLoading(false);
        }
    }, [picture, props.navigation, props.route.params?.data?.peer, dispatch]);

    return (
        <View style={[styles.container, { paddingBottom: edgeInsets.bottom, paddingHorizontal: edgeInsets.left }]}>
            {!device && !picture &&
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" />
                </View>
            }
            {device && !picture && !hasPermission &&
                <View style={styles.loaderContainer}>
                    <Text variant="titleLarge">Permission to use camera denied</Text>
                </View>
            }

            {picture &&
                <>
                    <Image style={{ width: '100%', height: '100%' }}
                        source={{ uri: picture }}
                        resizeMode="contain" />

                    <View style={[styles.buttonContainer, { marginBottom: edgeInsets.bottom }]}>
                        <Button style={styles.button}
                            buttonColor={SECONDARY_LITE}
                            icon="refresh"
                            mode="contained"
                            onPress={reset}>
                            Take again
                        </Button>
                        <Button style={styles.button}
                            icon="send"
                            mode="contained"
                            onPress={send}
                            loading={loading}
                            disabled={loading}>
                            Send
                        </Button>
                    </View>
                </>
            }

            {device && hasPermission && !picture &&
                <>
                    <Camera style={{ width: '100%', height: '100%' }}
                        ref={camera}
                        device={device}
                        isActive={true}
                        isMirrored={device.position === 'front'}
                        enableZoomGesture={true}
                        photoQualityBalance={'speed'}
                        resizeMode={'contain'}
                        photo={true}
                        format={format}
                    />
                    <View style={[styles.buttonContainer, { marginBottom: edgeInsets.bottom }]}>
                        <Button style={styles.button}
                            buttonColor={SECONDARY_LITE}
                            icon="camera-party-mode"
                            mode="contained"
                            onPress={swapCamera}>
                            Swap Camera
                        </Button>
                        <Button style={styles.button}
                            icon="camera"
                            mode="contained"
                            onPress={takePic}
                            loading={loading}
                            disabled={loading}>
                            Take pic
                        </Button>
                    </View>
                </>
            }
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        backgroundColor: SECONDARY,
        padding: 5,
    }, loaderContainer: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
    }, buttonContainer: {
        position: 'absolute',
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        bottom: 0,
        paddingBottom: 15,
    }, button: {
        borderRadius: 100,
    },
});
