import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: '#1F1D21',//"#fc501c",
        paddingVertical: 5,
    }, backAndTitle: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        width: '50%',
        overflow: 'hidden'
    }, topBarText: {
        color: '#fff',
        fontSize: 15,
    }, buttonContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        zIndex: 20
    }, button: {
        height: 50,
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center'
    }, rightFloat: {
        justifyContent: "flex-end",
    }, padded: {
        paddingHorizontal: 15
    }, wider: {
        overflow: 'visible'
    }, profileBtn: {
        flexDirection: 'row',
        alignItems: 'center'
    }, profilePicContainer: {
        overflow: "hidden",
        borderRadius: Platform.OS === 'ios' ? 150 / 2 : 150,
        marginRight: 8
    }, profilePic: {
        width: 40,
        height: 40,
        borderRadius: Platform.OS === 'ios' ? 150 / 2 : 150,
    }
});

export default styles