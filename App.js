
import React from 'react';
import { createAppContainer } from "react-navigation";
import { createStackNavigator } from "react-navigation-stack";

import {Login, Signup, Home, Conversation, NewConversation} from './src'
import Header from './src/components/Header';
import HeaderConversation from "./src/components/HeaderConversation";


export default class App extends React.Component {
    render() {
        return <AppContainer />;
    }
}
const AppNavigator = createStackNavigator({
        Home: {
            screen: Home,
            navigationOptions: ({ navigation }) => ({
                title: 'Conversations', //`${navigation.state.params.name}'s Profile'`,
                header: <Header pageTitle="Conversations" navigation={navigation}/>
            })
        }, Conversation: {
            screen: Conversation,
            navigationOptions: ({ navigation }) => ({
                title: 'Someones number/name',
                header: <HeaderConversation navigation={navigation} data={navigation.state.params.data} allowBack={true}/>
            })
        }, NewConversation: {
            screen: NewConversation,
            navigationOptions: ({ navigation }) => ({
                title: 'New Conversation',
                header: <Header pageTitle="New Conversation" navigation={navigation} allowBack={true}/>
            })
        }
    },
    {
        initialRouteName: "Home"
    });

const AuthNavigator = createStackNavigator({
        Login: {screen: Login},
        Signup: {screen: Signup},
        AppNavigator: {
            screen: AppNavigator,
            navigationOptions:  {
                header: null,
            }
        }
    }, {
        initialRouteName: "Login"
    });

const AppContainer = createAppContainer(AuthNavigator);