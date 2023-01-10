import { StyleSheet } from "react-native";
import { SECONDARY } from './variables'

const globalStyle = StyleSheet.create({
    wrapper: {
        flex: 1,
        width: "100%",
        height: "100%",
        backgroundColor: SECONDARY, //'#526a84'
    }, textInfo: {
        color: '#fff'
    }, searchContainer: {
        alignItems: 'center'
    }, errorMsg: {
        color: 'red',
        textAlign: 'center',
        fontSize: 20,
        paddingVertical: 20
    }, fab: {
        position: 'absolute',
        margin: 20,
        right: 0,
        bottom: 0,
    },
});

export default globalStyle