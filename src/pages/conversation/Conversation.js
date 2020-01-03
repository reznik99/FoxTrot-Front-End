
import React, { Component } from "react";
import {ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ImageBackground } from "react-native";

import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faPaperPlane, faEllipsisH } from "@fortawesome/free-solid-svg-icons";

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
    }, messageContainer: {
        height: "90%",
        width: "90%",
        alignSelf: 'center'
    }, message: {
        padding: 15,
        marginVertical: 5,
        borderRadius: 10
    }, received: {
        alignSelf: 'flex-start',
        backgroundColor: '#faf1e6'
    }, sent: {
        alignSelf: 'flex-end',
        backgroundColor: '#abed87'
    }, inputContainer: {
        height: "10%",
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        borderRadius: 20,
        paddingHorizontal: 10
    }, input: {
        width: '75%',
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#faf1e6'
    }, buttonIcon: {
        color: '#fff'
    }
});

class Conversation extends Component{
    constructor(props){
        super(props);
    }

    render(){
        const { navigation } = this.props;
        const data = navigation.state.params.data;
        return(
            <ImageBackground source={require('../../res/background.jpg')} style={styles.container}>

                <ScrollView style={styles.messageContainer} ref={ref => this.scrollView = ref}
                            onContentSizeChange={(contentWidth, contentHeight)=>{
                                this.scrollView.scrollToEnd({animated: true});
                            }}>
                    {
                        data ? data.messages.map( (packet, index) => {
                            return packet.from === 'Fraser Geddes'
                                ?<Text key={index} style={[styles.message, styles.sent]}>{ packet.content }</Text>
                                :<Text key={index} style={[styles.message, styles.received]}>{ packet.content }</Text>
                        }) : <Text>No messages</Text>
                    }
                </ScrollView>

                <View style={styles.inputContainer}>
                    <TouchableOpacity style={styles.button}>
                        <FontAwesomeIcon icon={ faEllipsisH } size={20} style={styles.buttonIcon}/>
                    </TouchableOpacity>
                    <TextInput placeholder="Type a message"
                               onChangeText={ TextInputValue =>
                                   this.setState({username : TextInputValue }) }
                               underlineColorAndroid='transparent'
                               style={styles.input}
                    />
                    <TouchableOpacity style={styles.button}>
                        <FontAwesomeIcon icon={ faPaperPlane } size={20} style={styles.buttonIcon}/>
                    </TouchableOpacity>
                </View>

            </ImageBackground >
        );
    }

}

export default Conversation;