import { StyleSheet } from 'react-native';
import { PRIMARY, SECONDARY, ACCENT } from '@/global/variables'


const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#232323'
    }, 
    wrapper: {
        flex: 1,
        width: "70%",
        height: "100%",
        justifyContent: 'center',
        padding: 10
    }, 
    formWrapper: {
        flex: 1,
        width: "100%",
        height: "100%",
        alignItems: 'center',
    }, 
    button: {
        width: '100%',
        backgroundColor: PRIMARY
    }, 
    buttonCyan: {
        backgroundColor: "#00aaaa"
    }, 
    titleContainer: {
        display: 'flex',
        alignItems: 'center',
        marginVertical: 25
    }, 
    title:{
        fontSize: 35
    }, 
    subTitle: {
        fontSize: 20, 
        color: 'gray'
    }, 
    errorMsg: {
        color: 'red',
        textAlign: 'center'
    }
});

export default styles;