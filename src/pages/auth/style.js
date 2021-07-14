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
    }, button: {
        width: '100%',
        padding: 5,
    }, buttonCyan: {
        backgroundColor: "#00aaaa"
    }, logoView: {
        marginTop: 0,
    }, title: {
        textAlign: "center",
        paddingVertical: 10,
    }, errorMsg: {
        color: 'red',
        textAlign: 'center'
    }
});

export default styles;