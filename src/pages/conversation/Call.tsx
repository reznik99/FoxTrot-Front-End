import React, { useEffect, useState } from "react"
import { SafeAreaView, StyleSheet, View, Text, TouchableOpacity } from "react-native"
import { Button } from "react-native-paper"
import { mediaDevices, MediaStream, RTCView } from 'react-native-webrtc'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faPhone, faPhoneFlip, faMicrophone, faVideoCamera } from "@fortawesome/free-solid-svg-icons";

import { UserData } from "~/store/reducers/user"

interface Props {
    route: {
        params: {
            data: {
                peer_user: UserData
            }
        }
    }
}

export default function Call(props: Props) {

    const { peer_user } = props.route.params.data

    const [stream, setStream] = useState<MediaStream | undefined>(undefined);
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
            const s = await mediaDevices.getUserMedia({ video: true })
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
            {stream &&
                <RTCView style={styles.stream}
                    streamURL={stream.toURL()}
                    mirror={true}
                    objectFit={'cover'} />
            }
            <View style={styles.footer}>
                <View style={{ flexDirection: "row" }}>
                    { !stream && 
                        <TouchableOpacity  onPress={start} style={[styles.actionButton, {backgroundColor: 'green'}]}>
                            <FontAwesomeIcon icon={faPhoneFlip} size={20} />
                        </TouchableOpacity> 
                    }
                    { stream && 
                        <>
                            <TouchableOpacity onPress={stop} style={[styles.actionButton, {backgroundColor: 'gray'}]}>
                                <FontAwesomeIcon icon={faMicrophone} size={20} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={stop} style={[styles.actionButton, {backgroundColor: 'gray'}]}>
                                <FontAwesomeIcon icon={faVideoCamera} size={20} />
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
        flex: 1
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
    }
});