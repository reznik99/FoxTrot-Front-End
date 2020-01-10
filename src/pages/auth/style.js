import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        width: "100%",
        height: "100%",
    }, container: {
        flex: 1,
        alignSelf: "center",
        width: "70%"
    }, input: {
        textAlign: 'center',
        width: '100%',
        marginBottom: 7,
        height: 40,
        borderRadius: 5 ,
        fontSize: 17,
    }, button: {
        height: 50,
        backgroundColor: 'purple',
        justifyContent: 'center',
        alignItems: 'center'
    }, buttonText: {
        fontSize: 20,
        color: '#FFFFFF',
    }, buttonCyan: {
        backgroundColor: "#00aaaa"
    }, logoView: {
        marginVertical: 50,
    }, title: {
        fontSize: 35,
        textAlign: "center",
    }, subTitle: {
        fontSize: 20,
        padding: 10,
        textAlign: "center",
        color: "gray"
    }, errorMsg: {
        color: 'red',
        textAlign: 'center'
    }

});

export default styles;