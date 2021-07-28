import React, { Component } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';

import { Button, Menu, Divider, Provider } from 'react-native-paper';

import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faBars, faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import styles from "./HeaderStyles";

class Header extends Component {
    constructor(props) {
        super(props);

        this.state = {
            visible: false,
        }
    }
    render() {
        return (
            <View style={[styles.topBar, styles.padded]}>
                <View style={[styles.backAndTitle, styles.wider]}>
                    {
                        this.props.allowBack ?
                            <TouchableOpacity style={styles.button} onPress={() => this.props.navigation.goBack(null)}>
                                <FontAwesomeIcon icon={faArrowLeft} size={22} style={styles.topBarText} />
                            </TouchableOpacity>
                            :
                            null
                    }
                    <Text style={styles.topBarText}>{this.props.pageTitle}</Text>
                </View>

                <Provider>
                    <View style={[styles.buttonContainer, styles.rightFloat]}>
                        <Menu visible={this.state.visible}
                            onDismiss={() => this.setState({ visible: false })}
                            anchor={
                                <TouchableOpacity style={styles.button} onPress={() => this.setState({ visible: true })}>
                                    <FontAwesomeIcon icon={faBars} size={20} style={styles.topBarText} />
                                </TouchableOpacity>
                            }>
                            <Menu.Item onPress={() => this.props.navigation.navigate('Login')} title="Logout" />
                            <Menu.Item onPress={() => this.props.navigation.navigate('Login')} title="Logout" />
                            <Divider />
                            <Menu.Item onPress={() => this.props.navigation.navigate('Login')} title="Logout" />
                        </Menu>
                    </View>
                </Provider>
            </View>
        );
    }
}

export default Header;
