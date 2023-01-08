import React, { useEffect, useState } from "react";
import { SafeAreaView, StyleSheet, View, Text, TouchableOpacity, Image } from "react-native";
import { useSelector, useDispatch } from 'react-redux';
import { mediaDevices, MediaStream, RTCView } from 'react-native-webrtc';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faPhone, faPhoneFlip, faMicrophone, faMicrophoneSlash, faVideoCamera, faVideoSlash, faCameraRotate } from "@fortawesome/free-solid-svg-icons";

import { UserData } from "~/store/reducers/user";
import { RootState } from "~/store/store";

export default function Call(props: Props) {

    const { peer_user } = props.route.params.data
    const dispatch = useDispatch()
    const user_data = useSelector((state: RootState) => state.userReducer.user_data)

    const [stream, setStream] = useState<MediaStream | undefined>(undefined);
    const [peerStream, setPeerStream] = useState<MediaStream | undefined>(undefined);

    const [videoEnabled, setVideoEnabled] = useState(true)
    const [voiceEnabled, setVoiceEnabled] = useState(true)
    const [isFrontCamera, setIsFrontCamera] = useState(true)

    const [callStatus, setCallStatus] = useState('')
    const [callTime, setCallTime] = useState(Date.now())
    const [startTime, setStartTime] = useState(Date.now())

    useEffect(() => {
        start()
        const timer = setInterval(() => setCallTime((Date.now() - startTime) / 1000), 1000)

        return () => {
            clearInterval(timer)
            stop()
        }
    }, [])

    const start = async () => {
        if (stream) return

        try {
            const s = await mediaDevices.getUserMedia({ video: true, audio: true })
            setStartTime(Date.now())
            setStream(s)
            // TODO: Do webrtc call logic
            setCallStatus(`Dialing ${peer_user?.phone_no}...`)
        } catch (e) {
            console.error(e)
        }
    }

    const stop = () => {
        if (!stream) return

        stream.release()
        setStream(undefined)
        setCallStatus('Call ended')
    };

    const toggleVideoEnabled = async () => {
        if (!stream) return

        const videoTrack = await stream.getVideoTracks()[ 0 ];
	    videoTrack.enabled = !videoEnabled;
        setVideoEnabled(!videoEnabled)
    };

    const toggleVoiceEnabled = async () => {
        if (!stream) return

        const audioTrack = await stream.getAudioTracks()[ 0 ];
	    audioTrack.enabled = !voiceEnabled;
        setVoiceEnabled(!voiceEnabled)
    };

    const toggleCamera = async () => {
        if (!stream) return

        const videoTrack = await stream.getVideoTracks()[ 0 ];
	    videoTrack._switchCamera();
        setIsFrontCamera(!isFrontCamera)
    };

    const printCallTime = () => {
        const hours = ~~(callTime / (60 * 60))
        const minutes = ~~(callTime / 60)
        const seconds = ~~(callTime - (minutes * 60))

        return `${hours}:${minutes}:${seconds}`
    }

    return (
        <SafeAreaView style={styles.body}>
            <View style={styles.header}>
                <Text>{callStatus}</Text>
                { stream && <Text>{printCallTime()}</Text> }
            </View>
            <View style={{width: '100%', flex: 1}}>
                { peerStream
                    ? <RTCView style={styles.stream}
                        streamURL={peerStream.toURL()}
                        mirror={true}
                        objectFit={'cover'} />
                    : <Image style={[styles.stream, { backgroundColor: '#333333' }]} source={{ uri: peer_user.pic }}/>
                }
                { stream && videoEnabled
                    ? <RTCView style={styles.cameraDisabled}
                        streamURL={stream.toURL()}
                        mirror={isFrontCamera}
                        objectFit={'cover'} />
                    : <Image style={styles.cameraDisabled} source={{ uri: user_data.pic }}/>
                }
            </View>
            <View style={styles.footer}>
                <View style={{ flexDirection: "row" }}>
                    { !stream && 
                        <TouchableOpacity  onPress={start} style={[styles.actionButton, {backgroundColor: 'green'}]}>
                            <FontAwesomeIcon icon={faPhoneFlip} size={20} />
                        </TouchableOpacity> 
                    }
                    { stream && 
                        <>
                            <TouchableOpacity onPress={toggleVoiceEnabled} style={styles.actionButton}>
                                <FontAwesomeIcon icon={voiceEnabled ? faMicrophone : faMicrophoneSlash} size={20} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={toggleVideoEnabled} style={styles.actionButton}>
                                <FontAwesomeIcon icon={videoEnabled ? faVideoCamera : faVideoSlash} size={20} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={toggleCamera} style={styles.actionButton}>
                                <FontAwesomeIcon icon={faCameraRotate} size={20} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={stop} style={[styles.actionButton, {backgroundColor: 'red'}]}>
                                <FontAwesomeIcon icon={faPhone} size={20} />
                            </TouchableOpacity>
                        </>
                    }
                </View>
            </View>
        </SafeAreaView>
    )
}

interface Props {
    route: {
        params: {
            data: {
                peer_user: UserData
            }
        }
    }
}

const styles = StyleSheet.create({
    header: {
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#777777a0",
        position: "absolute",
        width: "100%",
        top: 0,
        zIndex: 2,
        paddingVertical: 5
    }, body: {
        backgroundColor: "white",
        justifyContent: 'center',
        width: '100%',
        height: '100%',
    }, stream: {
        flex: 1,
        width: '100%'
    }, footer: {
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#777777a0",
        position: "absolute",
        width: "100%",
        bottom: 0,
        zIndex: 2
    }, actionButton: {
        borderRadius: 50,
        padding: 15,
        margin: 5,
        backgroundColor: 'gray'
    }, cameraDisabled: {
        position: 'absolute',
        height: 250,
        width: 200,
        bottom: 60, 
        right: 0,
        backgroundColor: '#333333'
    }
});