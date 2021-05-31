import { StyleSheet } from "react-native";

const globalStyle = StyleSheet.create({
    wrapper: {
        flex: 1,
        width: "100%",
        height: "100%",
        backgroundColor: '#526a84'
    }, textInfo: {
        color: '#fff'
    }, searchContainer: {
        alignItems: 'center'
    }, searchBar: {
        textAlign: 'center',
        width: '70%',
        margin: 10,
        height: 40,
        borderRadius: 5,
        fontSize: 17,
    }, errorMsg: {
        color: 'red',
        textAlign: 'center',
        fontSize: 20
    }
});

export default globalStyle