import React, { Component } from 'react';
import { Text, View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

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
        padding: 10,
        height: 40,
        borderRadius: 5 ,
        fontSize: 20,
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

export default class Login extends Component {
    constructor(props){
        super(props);

        this.state = {
            username: '',
            password: '',
            re_password: '',
            loading: false,
            message: ''
        }
    }

    render() {
        return (
            <View style={styles.wrapper}>
                <View style={styles.logoView}>
                    <Text style={styles.title}>FoxTrot</Text>
                    <Text style={styles.subTitle}>secure communications</Text>
                </View>
                <View style={styles.container}>
                    { this.state.message ? <Text style={styles.errorMsg}>{this.state.message}</Text> : null}
                    <TextInput placeholder="Enter User name"
                               onChangeText={ TextInputValue =>
                                   this.setState({username : TextInputValue }) }
                               underlineColorAndroid='transparent'
                               style={styles.input}
                    />
                    <TextInput placeholder="Enter password"
                               onChangeText={ TextInputValue =>
                                   this.setState({password: TextInputValue }) }
                               underlineColorAndroid='transparent'
                               secureTextEntry={true}
                               style={styles.input}
                    />
                    <TextInput placeholder="Repeat password"
                               onChangeText={ TextInputValue =>
                                   this.setState({re_password: TextInputValue }) }
                               underlineColorAndroid='transparent'
                               secureTextEntry={true}
                               style={styles.input}
                    />
                    <TouchableOpacity style={[styles.button, styles.buttonCyan]}>
                        <Text style={styles.buttonText}>Signup</Text>
                    </TouchableOpacity>
                    <Text style={styles.subTitle}>Or</Text>
                    <TouchableOpacity style={styles.button}
                                      onPress={() => this.props.navigation.navigate('Login')}>
                        <Text style={styles.buttonText}>Login</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }
}

