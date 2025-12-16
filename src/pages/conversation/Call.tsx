import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { connect, ConnectedProps } from 'react-redux';
import { Icon } from 'react-native-paper';
import { mediaDevices, MediaStream, RTCPeerConnection, RTCSessionDescription, RTCView } from 'react-native-webrtc';
import InCallManager from 'react-native-incall-manager';
import Toast from 'react-native-toast-message';
import { StackScreenProps } from '@react-navigation/stack';
import { withSafeAreaInsets, WithSafeAreaInsetsProps } from 'react-native-safe-area-context';
import { RTCOfferOptions } from 'react-native-webrtc/lib/typescript/RTCUtil';

import { CandidatePair, LocalCandidate, getConnStats, getIconForConnType, getRTCConfiguration } from '~/global/webrtc';
import { DARKHEADER } from '~/global/variables';
import { resetCallState, SocketData } from '~/store/actions/websocket';
import { UserData } from '~/store/reducers/user';
import { RootState } from '~/store/store';
import { HomeStackParamList } from '../../../App';


class Call extends React.Component<Props, State> {
    callTimer: NodeJS.Timeout | undefined;
    callStatsTimer: NodeJS.Timeout | undefined;

    constructor(props: Props) {
        super(props);
        this.state = {
            peerUser: this.props.route?.params?.data?.peer_user || this.props.caller,
            peerConnection: undefined,
            stream: undefined,
            peerStream: undefined,
            videoEnabled: true,
            voiceEnabled: true,
            loudSpeaker: false,
            isFrontCamera: true,
            minimizeLocalStream: true,
            callStatus: '',
            connectionInfo: undefined,
            callTime: Date.now(),
            startTime: Date.now(),
        };
        this.callTimer = undefined;
        this.callStatsTimer = undefined;
    }

    componentDidMount = () => {
        this.callTimer = setInterval(() => this.setState({ callTime: (Date.now() - this.state.startTime) / 1000 }), 1000);
        this.callStatsTimer = setInterval(() => this.checkConnectionType, 4000);

        InCallManager.start({ media: 'video', auto: true });
        InCallManager.setSpeakerphoneOn(false);
        InCallManager.setKeepScreenOn(true);
        this.checkCallStatus(undefined);
    };

    componentWillUnmount = () => {
        InCallManager.setKeepScreenOn(false);
        InCallManager.stop();
        // If call is active then let peer know we closed the call page
        const callIsActive = !this.state.peerStream
        this.endCall(callIsActive);
        if (this.callTimer) { clearInterval(this.callTimer); }
        if (this.callStatsTimer) { clearInterval(this.callStatsTimer); }
    };

    componentDidUpdate = async (prevProps: Readonly<Props>, _prevState: Readonly<State>) => {
        await this.checkCallStatus(prevProps);
    };

    checkCallStatus = async (prevProps: Readonly<Props> | undefined) => {
        // Check if peer has hanged up
        if (this.props.callClosed && !prevProps?.callClosed) {
            console.debug('Peer closed the call!');
            this.endCall(true);
        }
        // Check if peer has answered our call
        if (this.props.callAnswer && !prevProps?.callAnswer) {
            if (this.state.peerConnection) {
                // User answered our call, set remote description on webrtc connection and add recieved ice candidates
                const offerDescription = new RTCSessionDescription(this.props.callAnswer);
                await this.state.peerConnection.setRemoteDescription(offerDescription);
                this.props.iceCandidates.forEach(iceCandidate => {
                    // console.debug('Got ICE candidate after peer answered, adding to peerConnection:', iceCandidate);
                    this.state.peerConnection?.addIceCandidate(iceCandidate);
                });
            }
        }
        // Check if peer is calling us
        if (this.props.callOffer && !prevProps?.callOffer) {
            // Attempt to start local stream and answer the peer's call
            await this.startStream();
        }
    };

    answerCall = async () => {
        if (!this.state.peerConnection) { return console.debug('answerCall: Unable to answer call with null peerConnection'); }

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
                sender_id: this.props.userData.id,
                sender: this.props.userData.phone_no,
                reciever_id: this.state.peerUser.id,
                reciever: this.state.peerUser.phone_no,
                answer: answerDescription,
            },
        };
        this.props.socketConn?.send(JSON.stringify(message));

        this.props.iceCandidates.forEach(iceCandidate => {
            // console.debug('Got ICE candidate after we answered, adding to peerConnection:', iceCandidate);
            this.state.peerConnection?.addIceCandidate(iceCandidate);
        });
    };

    call = async () => {
        if (!this.state.peerConnection) { return console.error('call: Unable to initiate call with null peerConnection'); }

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
                sender_id: this.props.userData.id,
                sender: this.props.userData.phone_no,
                reciever_id: this.state.peerUser.id,
                reciever: this.state.peerUser.phone_no,
                offer: offerDescription,
            },
        };
        this.props.socketConn?.send(JSON.stringify(message));

        this.setState({ callStatus: `${this.state.peerUser?.phone_no} : Dialing` });
    };

    startStream = async () => {
        if (this.state.stream) { return; }

        try {
            console.debug('startStream - Loading local MediaStreams');
            const newStream = await mediaDevices.getUserMedia({ video: true, audio: true });

            console.debug('startStream - RTCPeerConnection Init');
            const newConnection = new RTCPeerConnection(getRTCConfiguration(this.props.turnServerCreds));

            // Event handlers
            newConnection.addEventListener('icecandidateerror', () => {
                Toast.show({
                    type: 'error',
                    text1: 'Error occoured during call',
                    text2: 'Unable to find viable path to peer',
                });
            });
            newConnection.addEventListener('icecandidate', (event: any) => {
                if (!event.candidate) { console.debug('onIceCandidate finished'); }
                // Send the iceCandidate to the other participant. Using websockets
                const message: SocketData = {
                    cmd: 'CALL_ICE_CANDIDATE',
                    data: {
                        sender_id: this.props.userData.id,
                        sender: this.props.userData.phone_no,
                        reciever_id: this.state.peerUser.id,
                        reciever: this.state.peerUser.phone_no,
                        candidate: event.candidate?.toJSON() || event.candidate,
                    },
                };
                this.props.socketConn?.send(JSON.stringify(message));
            });
            newConnection.addEventListener('connectionstatechange', _event => {
                console.debug('WebRTC connection state change:', newConnection?.connectionState);
                this.setState({ callStatus: `${this.state.peerUser?.phone_no} : ${newConnection?.connectionState}` });
                if (newConnection?.connectionState === 'disconnected') { this.endCall(true); }
            });
            newConnection.addEventListener('iceconnectionstatechange', _event => {
                console.debug('ICE connection state change:', newConnection?.iceConnectionState);
                if (newConnection.iceConnectionState === 'connected') {
                    this.checkConnectionType();
                }
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
                if (!this.props.callOffer) { this.call(); }
                else { this.answerCall(); }
            });
        } catch (err: any) {
            console.error('startStream error:', err);
        }
    };

    endCall = (isEvent: boolean = false) => {
        // Close networking
        this.state.stream?.release?.();
        this.state.peerConnection?.close?.();
        // Reset local state
        this.setState({
            peerConnection: undefined,
            stream: undefined,
            peerStream: undefined,
            callStatus: '',
        });
        // Let peer know we hung up, through websocket
        if (!isEvent) {
            const message: SocketData = {
                cmd: 'CALL_CLOSED',
                data: {
                    reciever_id: this.state.peerUser.id,
                    reciever: this.state.peerUser.phone_no,
                    sender_id: this.props.userData.id,
                    sender: this.props.userData.phone_no,
                },
            };
            this.props.socketConn?.send(JSON.stringify(message));
        }
        // Reset redux state
        this.props.resetCallState();
    };

    toggleVideoEnabled = async () => {
        if (!this.state.stream) { return; }

        const newVideoEnabled = !this.state.videoEnabled;
        const videoTrack = this.state.stream.getVideoTracks()[0];
        videoTrack.enabled = newVideoEnabled;
        this.setState({ videoEnabled: newVideoEnabled });
    };

    toggleVoiceEnabled = () => {
        if (!this.state.stream) { return; }

        const newVoiceEnabled = !this.state.voiceEnabled;
        const audioTrack = this.state.stream.getAudioTracks()[0];
        audioTrack.enabled = newVoiceEnabled;
        InCallManager.setMicrophoneMute(newVoiceEnabled);
        this.setState({ voiceEnabled: newVoiceEnabled });
    };

    toggleLoudSpeaker = () => {
        if (!this.state.stream) { return; }

        const newLoudSpeaker = !this.state.loudSpeaker;
        InCallManager.setSpeakerphoneOn(newLoudSpeaker);
        this.setState({ loudSpeaker: newLoudSpeaker });
    };

    toggleCamera = () => {
        if (!this.state.stream) { return; }

        const newIsFrontCamera = !this.state.isFrontCamera;
        const videoTrack = this.state.stream.getVideoTracks()[0];
        videoTrack.applyConstraints({ facingMode: newIsFrontCamera ? 'user' : 'environment' });
        this.setState({ isFrontCamera: newIsFrontCamera });
    };

    toggleMinimizedStream = () => {
        this.setState({ minimizeLocalStream: !this.state.minimizeLocalStream });
    };

    printCallTime = () => {
        // ~~ = fast Math.floor
        const hours = ~~(this.state.callTime / (60 * 60));
        const minutes = ~~(this.state.callTime / 60);
        const seconds = ~~(this.state.callTime - (minutes * 60));

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    checkConnectionType = async () => {
        if (!this.state.peerConnection) { return; }
        // Get all WebRTC connection stats
        const reports = await getConnStats(this.state.peerConnection);
        // Filter what we want
        const candidatePair = reports
            .find(rp => rp.type === 'candidate-pair' && rp.state === 'succeeded') as CandidatePair | undefined;
        const localCandidate = reports
            .find(rp => rp.type === 'local-candidate' && rp.id === candidatePair?.localCandidateId) as LocalCandidate | undefined;

        console.debug('candidatePair:', candidatePair);
        console.debug('localCandidate:', localCandidate);
        if (!candidatePair || !localCandidate) { return; }

        this.setState({
            connectionInfo: { localCandidate, candidatePair },
        });
    };

    renderCallInfo = () => {
        const localCandidate = this.state.connectionInfo?.localCandidate;
        const candidatePair = this.state.connectionInfo?.candidatePair;
        return (
            this.state.stream && <View>
                <Text>{this.printCallTime()} : {localCandidate?.protocol}({localCandidate?.networkType})</Text>
                <Text>Connection : {localCandidate?.candidateType} {getIconForConnType(localCandidate?.candidateType || '')}</Text>
                <Text>Delay(RTT) : {(candidatePair?.currentRoundTripTime || 0) * 1000}ms</Text>
            </View>
        );
    };

    render = () => {
        return (
            <View style={styles.body}>
                {/* Header */}
                <View style={styles.header}>
                    <Text>{this.state.callStatus}</Text>
                    {this.renderCallInfo()}
                </View>
                {/* Remote camera view or placeholder */}
                <View style={{ width: '100%', flex: 1 }}>
                    {this.state.peerStream && this.state.peerConnection?.connectionState === 'connected'
                        ? <RTCView style={styles.stream}
                            streamURL={this.state.peerStream.toURL()}
                            mirror={true}
                            objectFit={'cover'}
                            zOrder={1} />
                        : <Image style={[styles.stream, { backgroundColor: '#333333' }]}
                            source={{ uri: this.state.peerUser?.pic }} />
                    }
                </View>
                <View style={[styles.footer]}>
                    {/* Local camera view or placeholder */}
                    {this.state.stream && this.state.videoEnabled
                        ? <RTCView style={[styles.userCamera, this.state.minimizeLocalStream && styles.userCameraSmall]}
                            streamURL={this.state.stream.toURL()}
                            mirror={this.state.isFrontCamera}
                            objectFit={'cover'}
                            zOrder={2}
                            onTouchEnd={this.toggleMinimizedStream} />
                        : <Image style={[styles.userCamera, this.state.minimizeLocalStream && styles.userCameraSmall]}
                            source={{ uri: this.props.userData.pic }} />
                    }
                    <View style={[styles.actionContainer, { paddingBottom: this.props.insets.bottom }]}>
                        {/* Inactive call controls */}
                        {!this.state.stream &&
                            <TouchableOpacity onPress={this.startStream} style={[styles.actionButton, styles.bgGreen]}>
                                <Icon source="phone" size={20} />
                            </TouchableOpacity>
                        }
                        {/* Active call controls */}
                        {this.state.stream &&
                            <>
                                <TouchableOpacity onPress={this.toggleLoudSpeaker} style={[styles.actionButton, this.state.loudSpeaker && styles.bgWhite]}>
                                    <Icon source="volume-high" size={20} color={this.state.loudSpeaker ? 'black' : undefined} />
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
                                <TouchableOpacity onPress={() => this.endCall(false)} style={[styles.actionButton, styles.bgRed]}>
                                    <Icon source="phone" size={20} />
                                </TouchableOpacity>
                            </>
                        }
                    </View>
                </View>
            </View>
        );
    };
}

const mapStateToProps = (state: RootState) => ({
    callOffer: state.userReducer.callOffer,
    callAnswer: state.userReducer.callAnswer,
    callClosed: state.userReducer.callClosed,
    iceCandidates: state.userReducer.iceCandidates,
    userData: state.userReducer.user_data,
    caller: state.userReducer.caller,
    turnServerCreds: state.userReducer.turnServerCredentials,
    socketConn: state.userReducer.socketConn,
});

const mapDispatchToProps = {
    resetCallState,
};

const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>
export default withSafeAreaInsets(connector(Call));

interface State {
    peerUser: UserData;
    peerConnection: RTCPeerConnection | undefined;
    stream: MediaStream | undefined;
    peerStream: MediaStream | undefined;
    videoEnabled: boolean;
    voiceEnabled: boolean;
    loudSpeaker: boolean;
    isFrontCamera: boolean;
    minimizeLocalStream: boolean;
    callStatus: string;
    connectionInfo: {
        localCandidate: LocalCandidate;
        candidatePair: CandidatePair;
    } | undefined;
    callTime: number;
    startTime: number;
}

type Props = PropsFromRedux & StackScreenProps<HomeStackParamList, 'Call'> & WithSafeAreaInsetsProps

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
        backgroundColor: DARKHEADER,
        justifyContent: 'center',
        width: '100%',
        height: '100%',
    }, stream: {
        flex: 1,
        width: '100%',
    }, footer: {
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'absolute',
        width: '100%',
        bottom: 0,
    }, actionContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
        backgroundColor: '#777777a0',
    }, actionButton: {
        borderRadius: 50,
        padding: 15,
        margin: 5,
        backgroundColor: 'gray',
    }, userCamera: {
        width: 225,
        aspectRatio: 9 / 16,
        alignSelf: 'flex-end',
        borderRadius: 5,
        backgroundColor: '#333333f0',
    }, userCameraSmall: {
        width: 125,
        aspectRatio: 9 / 16,
    }, bgRed: {
        backgroundColor: 'red',
    }, bgGreen: {
        backgroundColor: 'green',
    }, bgWhite: {
        backgroundColor: 'white',
    },
});
