import { useCallback, useState } from "react";
import { PermissionsAndroid, StyleSheet, ToastAndroid, View } from "react-native";
import { Divider, IconButton, Menu } from "react-native-paper";
import { ImageZoom } from "@likashefqet/react-native-image-zoom";
import RNFS from 'react-native-fs'

import { DARKHEADER } from "~/global/variables";
import { GestureHandlerRootView } from "react-native-gesture-handler";

interface IProps {
    media: string;
    onDismiss: () => void
}

const FullScreenImage = (props: IProps) => {

    const [showMenu, setShowMenu] = useState(false)

    const download = useCallback(async () => {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) return

        const fullPath = RNFS.DownloadDirectoryPath + `/foxtrot-${Date.now()}.jpeg`
        await RNFS.writeFile(fullPath, props.media, 'base64')

        setShowMenu(false)
        ToastAndroid.show('Image saved', ToastAndroid.SHORT);
    }, [props.media])

    return (
        <View style={styles.container}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <ImageZoom uri={`data:image/jpeg;base64,${props.media}`}
                    resizeMode="contain" resizeMethod="auto" />
            </GestureHandlerRootView>
            <View style={styles.surface}>
                <IconButton icon='arrow-left-circle' size={25} onPress={props.onDismiss} />
                <Menu
                    visible={showMenu}
                    onDismiss={() => setShowMenu(false)}
                    anchor={<IconButton icon='dots-vertical' size={25} onPress={() => setShowMenu(true)} />}>
                    <Menu.Item title="Report" icon='information' />
                    <Divider />
                    <Menu.Item onPress={download} title="Download" icon='download'/>
                </Menu>
            </View>
        </View>
    )
}

export default FullScreenImage

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: '100%',
    },
    surface: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'absolute',
        bottom: 0,
        zIndex: 1,
        width: '100%',
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: DARKHEADER + 'f0'
    },
});