import React, { useEffect, useState } from "react";
import { SafeAreaView, StyleSheet, View, Text, TouchableOpacity, Image } from "react-native";
import { useSelector, useDispatch } from 'react-redux';
import { mediaDevices, MediaStream, RTCPeerConnection, RTCSessionDescription, RTCView } from 'react-native-webrtc';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faPhone, faPhoneFlip, faMicrophone, faMicrophoneSlash, faVideoCamera, faVideoSlash, faCameraRotate } from "@fortawesome/free-solid-svg-icons";

import { UserData } from "~/store/reducers/user";
import { RootState } from "~/store/store";
import { SocketData } from "~/store/actions/websocket";

export default function Call(props: Props) {

    const { peer_user } = props.route.params.data
    const dispatch = useDispatch()
    const user_data = useSelector((state: RootState) => state.userReducer.user_data)
    const websocket = useSelector((state: RootState) => state.userReducer.socketConn)
    const callOffer = useSelector((state: RootState) => state.userReducer.callOffer)
    const callAnswer = useSelector((state: RootState) => state.userReducer.callAnswer)
    const callCandidate = useSelector((state: RootState) => state.userReducer.callCandidate)

    const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | undefined>(undefined);
    const [remoteCandidates, setRemoteCandidates] = useState<any[]>([]);

    const [stream, setStream] = useState<MediaStream | undefined>(undefined);
    const [peerStream, setPeerStream] = useState<MediaStream | undefined>(undefined);

    const [videoEnabled, setVideoEnabled] = useState(true)
    const [voiceEnabled, setVoiceEnabled] = useState(true)
    const [isFrontCamera, setIsFrontCamera] = useState(true)

    const [callStatus, setCallStatus] = useState('')
    const [callTime, setCallTime] = useState(Date.now())
    const [startTime, setStartTime] = useState(Date.now())

    useEffect(() => {
        // start()
        const timer = setInterval(() => setCallTime((Date.now() - startTime) / 1000), 1000)

        return () => {
            clearInterval(timer)
            stop()
        }
    }, [])

    useEffect(() => {
        // Recieved an answer to call

        async function connect() {
            if(!callAnswer) return console.log("callAnswer is undefined")
            if(!peerConnection) return console.log("peerConnection is undefined")

            const offerDescription = new RTCSessionDescription( callAnswer );
            await peerConnection.setRemoteDescription( offerDescription );

            remoteCandidates.map( candidate => peerConnection.addIceCandidate( candidate ) )
	        setRemoteCandidates([])
        }
        connect()
    }, [callAnswer])

    useEffect(() => {
        // Recieved a possible ICE Candidate

        async function onIceCandidate() {
            if(!callCandidate) return console.log("callCandidate is undefined")
            if(!peerConnection) return console.log("peerConnection is undefined")

            if ( peerConnection.remoteDescription == null ) {
                return remoteCandidates.push( callCandidate );
            };
        
            await peerConnection?.addIceCandidate(callCandidate)
        }
        onIceCandidate()
    }, [callCandidate])

    useEffect(() => {
        // Recieved a call request

        if(!callOffer) return console.log("callOffer is undefined")
        start()
    }, [callOffer])

    const onIceCandidate = (event: any) => {
        if (!event.candidate) return console.log("onIceCandidate is undefined")
        console.log("onIceCandidate", event.candidate.toJSON())

        // Send the iceCandidate to the other participant. Using websockets
        const message: SocketData = {
            cmd: 'CALL_ICE_CANDIDATE',
            data: {
                sender_id: user_data.id,
                sender: user_data.phone_no,
                reciever_id: peer_user.id,
                reciever: peer_user.phone_no,
                candidate: event.candidate.toJSON()
            }
        }
        websocket?.send(JSON.stringify(message))
    }

    const start = async () => {
        if (stream) return

        try {
            console.debug('Loading Camera/Microphone Streams')
            const newStream = await mediaDevices.getUserMedia({ video: true, audio: true })
            setStartTime(Date.now())
            setStream(newStream)

            console.debug('RTCPeerConnection Init')
            let peerConstraints = { iceServers: [ { urls: 'stun:stun.l.google.com:19302' } ] };
            let newConnection = new RTCPeerConnection( peerConstraints );
            
            newConnection.addEventListener( 'connectionstatechange', event => console.log('on connectionstatechange: ', peerConnection?.connectionState) );
            newConnection.addEventListener( 'icecandidate', event =>  onIceCandidate(event) );
            newConnection.addEventListener( 'icecandidateerror', event => console.log('on icecandidateerror') );
            newConnection.addEventListener( 'iceconnectionstatechange', event => console.log('on iceconnectionstatechange: ', peerConnection?.iceConnectionState) );
            newConnection.addEventListener( 'icegatheringstatechange', event => {} );
            newConnection.addEventListener( 'negotiationneeded', event => {} );
            newConnection.addEventListener( 'signalingstatechange', event => {} );
            newConnection.addEventListener( 'addstream', event => {console.log('on addstream: ', event.stream); setPeerStream(event.stream)} );
            newConnection.addEventListener( 'track', event => { console.log('on track: ', event); peerConnection?.addTrack(event.track, event.streams); setPeerStream(event.streams[0]) } );
            newConnection.addEventListener( 'removestream', event => console.log('on removestream') );

            console.debug('Loading tracks and creating offer')
            newStream.getTracks().forEach(track => newConnection.addTrack(track, newStream))
            let sessionConstraints = {
                mandatory: {
                    OfferToReceiveAudio: true,
                    OfferToReceiveVideo: true,
                    VoiceActivityDetection: true
                }
            };
            let offerDescription: RTCSessionDescription | RTCSessionDescriptionInit
            if (!callOffer) { // Call the other guy
                offerDescription = await newConnection.createOffer( sessionConstraints ) as RTCSessionDescriptionInit;
                await newConnection.setLocalDescription( offerDescription as RTCSessionDescription);

                // Send the offerDescription to the other participant. Using websockets
                const message: SocketData = {
                    cmd: 'CALL_OFFER',
                    data: {
                        sender_id: user_data.id,
                        sender: user_data.phone_no,
                        reciever_id: peer_user.id,
                        reciever: peer_user.phone_no,
                        offer: offerDescription
                    }
                }
                websocket?.send(JSON.stringify(message))
            } else {
                // Use the received offerDescription
                offerDescription = new RTCSessionDescription( callOffer );
                await newConnection.setRemoteDescription( offerDescription );

                const answerDescription = await newConnection.createAnswer(sessionConstraints);
                await newConnection.setLocalDescription( answerDescription as RTCSessionDescription);

                // Send the answerDescription back as a response to the offerDescription. Using websockets
                const message: SocketData = {
                    cmd: 'CALL_ANSWER',
                    data: {
                        sender_id: user_data.id,
                        sender: user_data.phone_no,
                        reciever_id: peer_user.id,
                        reciever: peer_user.phone_no,
                        answer: answerDescription
                    }
                }
                websocket?.send(JSON.stringify(message))
            }

            setPeerConnection(newConnection)
            setCallStatus(`Dialing ${peer_user?.phone_no}...`)
        } catch (e) {
            console.error(e)
        }
    }

    const stop = () => {
        if (!stream) return

        stream.release()
        peerConnection?.close();
        setPeerConnection(undefined)
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
        borderRadius: 5,
        backgroundColor: '#333333f0'
    }
});