import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
    }, wrapper: {
        flex: 1,
        width: "70%",
        height: "100%",
        alignItems: 'center',
        justifyContent: 'center',
    }, formWrapper: {
        flex: 1,
        width: "100%",
        height: "100%",
        alignItems: 'center',
    }, button: {
        width: '100%',
    }, buttonCyan: {
        backgroundColor: "#00aaaa"
    }, title: {
        textAlign: "center",
        paddingVertical: 10,
    }, errorMsg: {
        color: 'red',
        textAlign: 'center'
    }
});

export default styles;