import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import Sound from 'react-native-nitro-sound';
import RNFS, { CachesDirectoryPath } from 'react-native-fs';

import CustomKeyboardAvoidingView from '~/components/CustomKeyboardAvoidingView';
import { DARKHEADER, PRIMARY, SECONDARY, SECONDARY_LITE } from '~/global/variables';

type IProps = {
    audioData: string;
    audioDuration: number;
}

export default function AudioPlayer(props: IProps) {
    const [audioPlaybackTime, setAudioPlaybackTime] = useState(0);
    const [playingAudio, setPlayingAudio] = useState(false);
    const [audioFilePath, setAudioFilePath] = useState('');

    useEffect(() => {
        const filePath = CachesDirectoryPath + Date.now()
        async function writeAudioToCache() {
            try {
                await RNFS.writeFile(filePath, props.audioData, 'base64')
                setAudioFilePath(filePath)
            } catch (err) {
                console.error('write audio message err:', err)
            }
        }
        if (props.audioData) {
            writeAudioToCache()
        }
        return () => {
            RNFS.unlink(filePath)
                .then(() => console.debug('Cleaned up temp audio message file'))
                .catch(err => console.error("audio message file cleanup err:", err))
        }
    }, [])

    const playAudio = useCallback(async () => {
        try {
            await Sound.startPlayer(audioFilePath)
            Sound.addPlayBackListener((e) => setAudioPlaybackTime(e.currentPosition));
            Sound.addPlaybackEndListener(() => setPlayingAudio(false));
            setPlayingAudio(true)
        } catch (err) {
            console.error(err); // Show error
        }
    }, [audioFilePath]);

    const stopAudio = useCallback(async () => {
        try {
            await Sound.stopPlayer();
            setPlayingAudio(false);
            Sound.removePlayBackListener();
            Sound.removePlaybackEndListener();
        } catch (err) {
            console.error(err); // Show error
        }
    }, []);

    return (
        <CustomKeyboardAvoidingView>
            {/* Audio data controls */}
            <View style={styles.audioContainer}>
                <View style={styles.inputContainer}>
                    <Text>{Sound.mmssss(audioPlaybackTime ? ~~audioPlaybackTime : ~~props.audioDuration)}</Text>
                    {playingAudio
                        ? <TouchableOpacity style={styles.button} onPress={stopAudio}>
                            <Icon source="pause"
                                color={PRIMARY}
                                size={25} />
                        </TouchableOpacity>
                        : <TouchableOpacity style={styles.button} onPress={playAudio}>
                            <Icon source="play"
                                color={PRIMARY}
                                size={25} />
                        </TouchableOpacity>
                    }
                </View>
                {/* Audio playback indicator */}
                <View style={{ width: '75%' }}>
                    <View style={{
                        width: `${(audioPlaybackTime / props.audioDuration) * 100}%`, // TODO: send length
                        height: 1,
                        backgroundColor: playingAudio ? SECONDARY : 'transparent'
                    }
                    }></View>
                </View>
            </View>
        </CustomKeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    audioContainer: {
        flexDirection: 'column',
        width: '100%',
        paddingHorizontal: 10,
        backgroundColor: DARKHEADER
    }, inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        paddingVertical: 10,
    }, button: {
        padding: 10,
    },
});
