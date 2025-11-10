import React from 'react';
import { SafeAreaView, StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { connect, ConnectedProps } from 'react-redux';
import { mediaDevices, MediaStream, RTCPeerConnection, RTCSessionDescription, RTCView } from 'react-native-webrtc';
import InCallManager from 'react-native-incall-manager';
import Toast from 'react-native-toast-message';
import { StackScreenProps } from '@react-navigation/stack';

import { UserData } from '~/store/reducers/user';
import { RootState } from '~/store/store';
import { resetCallState, SocketData } from '~/store/actions/websocket';
import { RTCOfferOptions } from 'react-native-webrtc/lib/typescript/RTCUtil';
import { Icon } from 'react-native-paper';
import { HomeStackParamList } from '../../../App';

const peerConstraints = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun.services.mozilla.com' },
    ],
};

class Call extends React.Component<Props, State> {
    timer: NodeJS.Timeout | undefined;

    constructor(props: Props) {
        super(props);
        this.state = {
            peer_user: this.props.route?.params?.data?.peer_user || this.props.caller,
            peerConnection: undefined,
            stream: undefined,
            peerStream: undefined,
            videoEnabled: true,
            voiceEnabled: true,
            loudSpeaker: false,
            isFrontCamera: true,
            minimizeLocalStream: true,
            callStatus: '',
            callTime: Date.now(),
            startTime: Date.now(),
        };
        this.timer = undefined;
    }

    componentDidMount = () => {
        this.timer = setInterval(() => this.setState({ callTime: (Date.now() - this.state.startTime) / 1000 }), 1000);
        InCallManager.start({ media: 'video', auto: true });
        InCallManager.setKeepScreenOn(true);
        this.checkCallStatus(undefined);
    };

    componentWillUnmount = () => {
        InCallManager.setKeepScreenOn(false);
        InCallManager.stop();
        this.endCall();
        if (this.timer) {clearInterval(this.timer);}
    };

    componentDidUpdate = async (prevProps: Readonly<Props>, _prevState: Readonly<State>) => {
        await this.checkCallStatus(prevProps);
    };

    checkCallStatus = async (prevProps: Readonly<Props> | undefined) => {
        // Check if peer has answered our call
        if (this.props.callAnswer && !prevProps?.callAnswer) {
            if (this.state.peerConnection) {
                // User answered our call, set remote description on webrtc connection and add recieved ice candidates
                const offerDescription = new RTCSessionDescription(this.props.callAnswer);
                await this.state.peerConnection.setRemoteDescription(offerDescription);
                this.props.iceCandidates.forEach(iceCandidate => this.state.peerConnection?.addIceCandidate(iceCandidate));
            }
        }

        // Check if peer is calling us
        if (this.props.callOffer && !prevProps?.callOffer) {
            // Attempt to start local stream and answer the peer's call
            await this.startStream();
        }
    };

    answerCall = async () => {
        if (!this.state.peerConnection) {return console.debug('answerCall: Unable to answer call with null peerConnection');}

        // Use the received offerDescription
        let offerDescription = new RTCSessionDescription(this.props.callOffer);
        await this.state.peerConnection.setRemoteDescription(offerDescription);

        const answerDescription = await this.state.peerConnection.createAnswer();
        await this.state.peerConnection.setLocalDescription(answerDescription as RTCSessionDescription);

        InCallManager.stopRingtone();

        // Send the answerDescription back as a response to the offerDescription. Using websockets
        const message: SocketData = {
            cmd: 'CALL_ANSWER',
            data: {
                sender_id: this.props.user_data.id,
                sender: this.props.user_data.phone_no,
                reciever_id: this.state.peer_user.id,
                reciever: this.state.peer_user.phone_no,
                answer: answerDescription,
            },
        };
        this.props.socketConn?.send(JSON.stringify(message));

        this.props.iceCandidates.forEach(iceCandidate => this.state.peerConnection?.addIceCandidate(iceCandidate));
    };

    call = async () => {
        if (!this.state.peerConnection) {return console.error('call: Unable to initiate call with null peerConnection');}

        let sessionConstraints: RTCOfferOptions = {
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
            voiceActivityDetection: true,
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
                offer: offerDescription,
            },
        };
        this.props.socketConn?.send(JSON.stringify(message));

        this.setState({ callStatus: `${this.state.peer_user?.phone_no} : Dialing`});
    };

    startStream = async () => {
        if (this.state.stream) {return;}

        try {
            console.debug('startStream - Loading local MediaStreams');
            const newStream = await mediaDevices.getUserMedia({ video: true, audio: true });

            console.debug('startStream - RTCPeerConnection Init');
            const newConnection = new RTCPeerConnection(peerConstraints);

            // Event handlers
            newConnection.addEventListener('icecandidateerror', () => Toast.show({
                type: 'error',
                text1: 'Error occoured during call',
                text2: 'Unable to find viable path to peer',
            })
            );
            newConnection.addEventListener('icecandidate', (event: any) => {
                if (!event.candidate) {console.debug('onIceCandidate finished');}
                // Send the iceCandidate to the other participant. Using websockets
                const message: SocketData = {
                    cmd: 'CALL_ICE_CANDIDATE',
                    data: {
                        sender_id: this.props.user_data.id,
                        sender: this.props.user_data.phone_no,
                        reciever_id: this.state.peer_user.id,
                        reciever: this.state.peer_user.phone_no,
                        candidate: event.candidate?.toJSON() || event.candidate,
                    },
                };
                this.props.socketConn?.send(JSON.stringify(message));
            });
            newConnection.addEventListener('connectionstatechange', _event => {
                console.debug('WebRTC connection state change: ', newConnection?.connectionState);
                this.setState({ callStatus: `${this.state.peer_user?.phone_no} : ${newConnection?.connectionState}` });
                if (newConnection?.connectionState === 'disconnected') {this.endCall();}
            });
            newConnection.addEventListener('iceconnectionstatechange', _event => {
                console.debug('ICE connection state change: ', newConnection?.iceConnectionState);
            });
            newConnection.addEventListener('track', (event: any) => {
                const newPeerStream = event.streams[0];
                newPeerStream.addTrack(event.track);
                this.setState({ peerStream: newPeerStream });
            });

            console.debug('startStream - Loading tracks');
            newStream.getTracks().forEach(track => newConnection.addTrack(track, newStream));

            this.setState({
                startTime: Date.now(),
                stream: newStream,
                peerConnection: newConnection,
            }, () => {
                if (!this.props.callOffer) {this.call();}
                else {this.answerCall();}
            });
        } catch (err: any) {
            console.error('startStream error:', err);
        }
    };

    endCall = () => {
        if (!this.state.stream) {return;}

        // Close networking
        this.state.stream.release();
        this.state.peerConnection?.close();
        // Reset local state
        this.setState({
            peerConnection: undefined,
            stream: undefined,
            peerStream: undefined,
            callStatus: '',
        });
        // Reset redux state
        this.props.resetCallState();
        // TODO: Let peer know we hung up, through websocket
    };

    toggleVideoEnabled = async () => {
        if (!this.state.stream) {return;}

        const videoTrack = await this.state.stream.getVideoTracks()[0];
        videoTrack.enabled = !this.state.videoEnabled;
        this.setState({ videoEnabled: !this.state.videoEnabled });
    };

    toggleVoiceEnabled = async () => {
        if (!this.state.stream) {return;}

        const audioTrack = await this.state.stream.getAudioTracks()[0];
        audioTrack.enabled = !this.state.voiceEnabled;
        this.setState({ voiceEnabled: !this.state.voiceEnabled });
    };

    toggleLoudSpeaker = () => {
        if (!this.state.stream) {return;}

        InCallManager.setSpeakerphoneOn(!this.state.loudSpeaker);
        this.setState({ loudSpeaker: !this.state.loudSpeaker });
    };

    toggleCamera = async () => {
        if (!this.state.stream) {return;}

        const videoTrack = await this.state.stream.getVideoTracks()[0];
        videoTrack._switchCamera();
        this.setState({ isFrontCamera: !this.state.isFrontCamera });
    };

    toggleMinimizedStream = () => {
        this.setState({minimizeLocalStream: !this.state.minimizeLocalStream});
    };

    printCallTime = () => {
        const hours = ~~(this.state.callTime / (60 * 60));
        const minutes = ~~(this.state.callTime / 60);
        const seconds = ~~(this.state.callTime - (minutes * 60));

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

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
                            zOrder={1} />
                        : <Image style={[styles.stream, { backgroundColor: '#333333' }]} source={{ uri: this.state.peer_user?.pic }} />
                    }
                    {this.state.stream && this.state.videoEnabled
                        ? <RTCView style={[styles.cameraDisabled, this.state.minimizeLocalStream && styles.cameraDisabledSmall]}
                            streamURL={this.state.stream.toURL()}
                            mirror={this.state.isFrontCamera}
                            objectFit={'cover'}
                            zOrder={2} onTouchEnd={this.toggleMinimizedStream}/>
                        : <Image style={[styles.cameraDisabled, this.state.minimizeLocalStream && styles.cameraDisabledSmall]} source={{ uri: this.props.user_data.pic }} />
                    }
                </View>
                <View style={styles.footer}>
                    <View style={{ flexDirection: 'row' }}>
                        {!this.state.stream &&
                            <TouchableOpacity onPress={this.startStream} style={[styles.actionButton, styles.bgGreen]}>
                                <Icon source="phone" size={20} />
                            </TouchableOpacity>
                        }
                        {this.state.stream &&
                            <>
                                <TouchableOpacity onPress={this.toggleLoudSpeaker} style={[styles.actionButton, this.state.loudSpeaker && styles.bgWhite]}>
                                    <Icon source="volume-high" size={20} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={this.toggleVoiceEnabled} style={styles.actionButton}>
                                    <Icon source={this.state.voiceEnabled ? 'microphone' : 'microphone-off'} size={20} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={this.toggleVideoEnabled} style={styles.actionButton}>
                                    <Icon source={this.state.videoEnabled ? 'video' : 'video-off'} size={20} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={this.toggleCamera} style={styles.actionButton}>
                                    <Icon source="camera-switch" size={20} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={this.endCall} style={[styles.actionButton, styles.bgRed]}>
                                    <Icon source="phone" size={20} />
                                </TouchableOpacity>
                            </>
                        }
                    </View>
                </View>
            </SafeAreaView>
        );
    };

}

const mapStateToProps = (state: RootState) => ({
    ...state.userReducer,
});

const mapDispatchToProps = {
    resetCallState,
};

const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>
export default connector(Call);

interface State {
    peer_user: UserData;
    peerConnection: RTCPeerConnection | undefined;
    stream: MediaStream | undefined;
    peerStream: MediaStream | undefined;
    videoEnabled: boolean;
    voiceEnabled: boolean;
    loudSpeaker: boolean;
    isFrontCamera: boolean;
    minimizeLocalStream: boolean;
    callStatus: string;
    callTime: number;
    startTime: number;
}

type Props = PropsFromRedux & StackScreenProps<HomeStackParamList, 'Call'>

const styles = StyleSheet.create({
    header: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#777777a0',
        position: 'absolute',
        width: '100%',
        top: 0,
        zIndex: 2,
        paddingVertical: 5,
    }, body: {
        backgroundColor: 'white',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
    }, stream: {
        flex: 1,
        width: '100%',
    }, footer: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#777777a0',
        position: 'absolute',
        width: '100%',
        bottom: 0,
        zIndex: 2,
    }, actionButton: {
        borderRadius: 50,
        padding: 15,
        margin: 5,
        backgroundColor: 'gray',
    }, cameraDisabled: {
        position: 'absolute',
        height: 275,
        width: 225,
        bottom: 60,
        right: 0,
        borderRadius: 5,
        backgroundColor: '#333333f0',
    }, cameraDisabledSmall: {
        height: 175,
        width: 125,
    }, bgRed: {
        backgroundColor: 'red',
    }, bgGreen: {
        backgroundColor: 'green',
    }, bgWhite: {
        backgroundColor: 'white',
    },
});
