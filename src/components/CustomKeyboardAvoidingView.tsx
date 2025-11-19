import { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, StyleSheet } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';


function CustomKeyboardAvoidingView({ children, style }: any) {
    const headerHeight = useHeaderHeight();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        Keyboard.addListener('keyboardDidShow', () => setOpen(true));
        Keyboard.addListener('keyboardDidHide', () => setOpen(false));
        return () => {
            Keyboard.removeAllListeners('keyboardDidShow');
            Keyboard.removeAllListeners('keyboardDidHide');
        };
    }, []);

    return (
        <KeyboardAvoidingView
            style={StyleSheet.compose(style, {})}
            behavior="padding"
            enabled={true}
            keyboardVerticalOffset={open ? headerHeight : 0}>
            {children}
        </KeyboardAvoidingView>
    );
}

export default CustomKeyboardAvoidingView;
