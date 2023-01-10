import React from "react";
import { SafeAreaView, StyleSheet, View, Text, TouchableOpacity, Image } from "react-native";
import { connect, ConnectedProps } from 'react-redux';
import { mediaDevices, MediaStream, RTCPeerConnection, RTCSessionDescription, RTCView } from 'react-native-webrtc';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faPhone, faPhoneFlip, faMicrophone, faMicrophoneSlash, faVideoCamera, faVideoSlash, faCameraRotate } from "@fortawesome/free-solid-svg-icons";

import { UserData } from "~/store/reducers/user";
import { RootState } from "~/store/store";
import { resetCallState, SocketData } from "~/store/actions/websocket";

class Call extends React.Component<Props, State> {
    timer: undefined | number;

    constructor(props: Props) {
        super(props)
        this.state = {
            peer_user: this.props.route.params.data.peer_user,
            iceCandidates: [],
            peerConnection: undefined,
            stream: undefined,
            peerStream: undefined,
            videoEnabled: true,
            voiceEnabled: true,
            isFrontCamera: true,
            callStatus: "",
            callTime: Date.now(),
            startTime: Date.now(),
        }
        this.timer = undefined
    }

    componentDidMount = () => {
        this.timer = setInterval(() => this.setState({ callTime: (Date.now() - this.state.startTime) / 1000 }), 1000)
    }
    componentWillUnmount = () => {
        this.endCall()
        if (this.timer) clearInterval(this.timer)
    }

    componentDidUpdate = async (prevProps: Readonly<Props>, prevState: Readonly<State>) => {
        if (this.props.callAnswer && !prevProps.callAnswer) {
            if (this.state.peerConnection) {
                console.debug('---peerConnection.setRemoteDescription---')
                const offerDescription = new RTCSessionDescription(this.props.callAnswer);
                await this.state.peerConnection.setRemoteDescription(offerDescription);

                this.state.iceCandidates.forEach(iceCandidate => this.state.peerConnection?.addIceCandidate(iceCandidate))
            }
        }

        if (this.props.callCandidate !== prevProps.callCandidate) {
            if (this.state.peerConnection?.remoteDescription) {
                console.debug('---peerConnection?.addIceCandidate---')
                await this.state.peerConnection.addIceCandidate(this.props.callCandidate)
            } else {
                this.setState({iceCandidates: [...this.state.iceCandidates, this.props.callCandidate]})
            }
        }

        if (this.props.callOffer && !prevProps.callOffer) {
            console.debug('---callOffer start()---')
            await this.startStream()
            await this.answerCall()
        }

    }

    onIceCandidate = (event: any) => {
        if (!event.candidate) console.debug("onIceCandidate finished")

        // Send the iceCandidate to the other participant. Using websockets
        const message: SocketData = {
            cmd: 'CALL_ICE_CANDIDATE',
            data: {
                sender_id: this.props.user_data.id,
                sender: this.props.user_data.phone_no,
                reciever_id: this.state.peer_user.id,
                reciever: this.state.peer_user.phone_no,
                candidate: event.candidate?.toJSON() || event.candidate
            }
        }
        this.props.socketConn?.send(JSON.stringify(message))
    }

    answerCall = async () => {
        if (!this.state.peerConnection) return console.debug('---peerConnection null after start()---')
        // Use the received offerDescription
        let offerDescription = new RTCSessionDescription(this.props.callOffer);
        await this.state.peerConnection.setRemoteDescription(offerDescription);

        const answerDescription = await this.state.peerConnection.createAnswer();
        await this.state.peerConnection.setLocalDescription(answerDescription as RTCSessionDescription);

        // Send the answerDescription back as a response to the offerDescription. Using websockets
        const message: SocketData = {
            cmd: 'CALL_ANSWER',
            data: {
                sender_id: this.props.user_data.id,
                sender: this.props.user_data.phone_no,
                reciever_id: this.state.peer_user.id,
                reciever: this.state.peer_user.phone_no,
                answer: answerDescription
            }
        }
        this.props.socketConn?.send(JSON.stringify(message))

        this.state.iceCandidates.forEach(iceCandidate => this.state.peerConnection?.addIceCandidate(iceCandidate))
    }

    call = async () => {
        if (!this.state.peerConnection) return console.debug('---peerConnection null after start()---')

        let sessionConstraints = {
            OfferToReceiveAudio: true,
            OfferToReceiveVideo: true,
            VoiceActivityDetection: true
        };
        let offerDescription = await this.state.peerConnection.createOffer(sessionConstraints) as RTCSessionDescriptionInit;
        await this.state.peerConnection.setLocalDescription(offerDescription as RTCSessionDescription);

        // Send the offerDescription to the other participant. Using websockets
        const message: SocketData = {
            cmd: 'CALL_OFFER',
            data: {
                sender_id: this.props.user_data.id,
                sender: this.props.user_data.phone_no,
                reciever_id: this.state.peer_user.id,
                reciever: this.state.peer_user.phone_no,
                offer: offerDescription
            }
        }
        this.props.socketConn?.send(JSON.stringify(message))
    }

    startStream = async () => {
        if (this.state.stream) return

        try {
            console.debug('Start - Loading Camera/Microphone Streams')
            const newStream = await mediaDevices.getUserMedia({ video: true, audio: true })

            console.debug('Start - RTCPeerConnection Init')
            let peerConstraints = {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun.services.mozilla.com' },
                    { urls: 'stun:stun.l.google.com:19302' }
                ]
            };
            let newConnection = new RTCPeerConnection(peerConstraints);

            // Event handlers
            newConnection.addEventListener('icecandidate', event => this.onIceCandidate(event));
            newConnection.addEventListener('icecandidateerror', event => console.debug('on icecandidateerror'));
            newConnection.addEventListener('connectionstatechange', event => {
                console.debug('on connectionstatechange: ', newConnection?.connectionState)
                this.setState({ callStatus: `${newConnection?.connectionState} : ${this.state.peer_user?.phone_no}` })
            });
            newConnection.addEventListener('iceconnectionstatechange', event => {
                console.debug('on iceconnectionstatechange: ', newConnection?.iceConnectionState)
                // this.setState({ callStatus: `ICE: ${newConnection?.iceConnectionState} : ${this.state.peer_user?.phone_no}` })
            });
            newConnection.addEventListener('track', (event: any) => {
                console.debug('on track: ');
                // const newPeerStream = new MediaStream([event.track])
                const newPeerStream = event.streams[0]
                newPeerStream.addTrack(event.track)
                this.setState({ peerStream: newPeerStream })
            });
            newStream.getTracks().forEach(track => newConnection.addTrack(track, newStream))

            this.setState({
                startTime: Date.now(),
                stream: newStream,
                peerConnection: newConnection
            })

            console.debug('Start - Loading tracks')
            if (!this.props.callOffer) await this.call()

        } catch (e) {
            console.error(e)
        }
    }

    endCall = () => {
        if (!this.state.stream) return
        // Close networking
        this.state.stream.release()
        this.state.peerConnection?.close()
        // Reset local state
        this.setState({
            peerConnection: undefined,
            stream: undefined,
            peerStream: undefined,
            callStatus: ''
        })
        // Reset redux state
        this.props.resetCallState()
    };

    toggleVideoEnabled = async () => {
        if (!this.state.stream) return

        const videoTrack = await this.state.stream.getVideoTracks()[0];
        videoTrack.enabled = !this.state.videoEnabled;
        this.setState({ videoEnabled: !this.state.videoEnabled })
    };

    toggleVoiceEnabled = async () => {
        if (!this.state.stream) return

        const audioTrack = await this.state.stream.getAudioTracks()[0];
        audioTrack.enabled = !this.state.voiceEnabled;
        this.setState({ voiceEnabled: !this.state.voiceEnabled })
    };

    toggleCamera = async () => {
        if (!this.state.stream) return

        const videoTrack = await this.state.stream.getVideoTracks()[0];
        videoTrack._switchCamera();
        this.setState({ isFrontCamera: !this.state.isFrontCamera })
    };

    printCallTime = () => {
        const hours = ~~(this.state.callTime / (60 * 60))
        const minutes = ~~(this.state.callTime / 60)
        const seconds = ~~(this.state.callTime - (minutes * 60))

        return `${hours}:${minutes}:${seconds}`
    }

    render = () => {
        return (
            <SafeAreaView style={styles.body}>
                <View style={styles.header}>
                    <Text>{this.state.callStatus}</Text>
                    {this.state.stream && <Text>{this.printCallTime()}</Text>}
                </View>
                <View style={{ width: '100%', flex: 1 }}>
                    {this.state.peerStream && this.state.peerConnection?.connectionState === 'connected'
                        ? <RTCView style={styles.stream}
                            streamURL={this.state.peerStream.toURL()}
                            mirror={true}
                            objectFit={'cover'} 
                            zOrder={1}/>
                        : <Image style={[styles.stream, { backgroundColor: '#333333' }]} source={{ uri: this.state.peer_user.pic }} />
                    }
                    {this.state.stream && this.state.videoEnabled
                        ? <RTCView style={styles.cameraDisabled}
                            streamURL={this.state.stream.toURL()}
                            mirror={this.state.isFrontCamera}
                            objectFit={'cover'} 
                            zOrder={2}/>
                        : <Image style={styles.cameraDisabled} source={{ uri: this.props.user_data.pic }} />
                    }
                </View>
                <View style={styles.footer}>
                    <View style={{ flexDirection: "row" }}>
                        {!this.state.stream &&
                            <TouchableOpacity onPress={this.startStream} style={[styles.actionButton, { backgroundColor: 'green' }]}>
                                <FontAwesomeIcon icon={faPhoneFlip} size={20} />
                            </TouchableOpacity>
                        }
                        {this.state.stream &&
                            <>
                                <TouchableOpacity onPress={this.toggleVoiceEnabled} style={styles.actionButton}>
                                    <FontAwesomeIcon icon={this.state.voiceEnabled ? faMicrophone : faMicrophoneSlash} size={20} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={this.toggleVideoEnabled} style={styles.actionButton}>
                                    <FontAwesomeIcon icon={this.state.videoEnabled ? faVideoCamera : faVideoSlash} size={20} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={this.toggleCamera} style={styles.actionButton}>
                                    <FontAwesomeIcon icon={faCameraRotate} size={20} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={this.endCall} style={[styles.actionButton, { backgroundColor: 'red' }]}>
                                    <FontAwesomeIcon icon={faPhone} size={20} />
                                </TouchableOpacity>
                            </>
                        }
                    </View>
                </View>
            </SafeAreaView>
        )
    }

}

const mapStateToProps = (state: RootState) => ({
    ...state.userReducer
})

const mapDispatchToProps = {
    resetCallState
}

const connector = connect(mapStateToProps, mapDispatchToProps)
type PropsFromRedux = ConnectedProps<typeof connector>
export default connector(Call)

interface IProps {
    route: {
        params: {
            data: {
                peer_user: UserData
            }
        }
    }
}

interface State {
    peer_user: UserData;
    iceCandidates: Array<any>;
    peerConnection: RTCPeerConnection | undefined;
    stream: MediaStream | undefined;
    peerStream: MediaStream | undefined;
    videoEnabled: boolean;
    voiceEnabled: boolean;
    isFrontCamera: boolean;
    callStatus: string;
    callTime: number;
    startTime: number;
}

type Props = IProps & PropsFromRedux

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
        width: '100%',
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
        backgroundColor: '#333333f0',
    }
});