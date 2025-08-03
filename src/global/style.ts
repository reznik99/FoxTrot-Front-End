import { StyleSheet } from 'react-native';
import { PRIMARY, SECONDARY } from './variables';

const globalStyle = StyleSheet.create({
    wrapper: {
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: SECONDARY,
    }, textInfo: {
        color: '#e3e1e1',
    }, searchContainer: {
        alignItems: 'center',
    }, errorMsg: {
        color: 'red',
        textAlign: 'center',
        fontSize: 20,
        paddingVertical: 20,
    }, fab: {
        position: 'absolute',
        margin: 20,
        right: 0,
        bottom: 0,
        backgroundColor: PRIMARY,
    },
});

export default globalStyle;
