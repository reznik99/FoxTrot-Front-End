import {StyleSheet} from "react-native";

const styles = StyleSheet.create({
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fc501c",
        paddingVertical: 5,
    }, backAndTitle:{
        flexDirection:'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        width: '50%',
        overflow: 'hidden'
    }, topBarText: {
        color: '#fff',
        fontSize: 15,
    }, buttonContainer:{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        width: '50%'
    }, button: {
        height: 50,
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center'
    }, rightFloat:{
        justifyContent: "flex-end",
    }, padded: {
        paddingHorizontal: 15
    }, wider:{
        overflow: 'visible'
    }
});

export default styles