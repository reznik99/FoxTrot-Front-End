
import React from 'react';
import { createAppContainer } from "react-navigation";
import { createStackNavigator } from "react-navigation-stack";
import { Provider } from 'react-redux';
import { store } from './src/store/store';

import { Login, Signup, Home, Conversation, NewConversation, AddContact } from './src'
import Header from './src/components/Header';
import HeaderConversation from "./src/components/HeaderConversation";


export default class App extends React.Component {
    render() {
        return (
            <Provider store={store}>
                <AppContainer />
            </Provider>
        );
    }
}
const AppNavigator = createStackNavigator({
    Home: {
        screen: Home,
        navigationOptions: ({ navigation }) => ({
            title: 'Conversations', //`${navigation.state.params.name}'s Profile'`,
            header: <Header pageTitle="Conversations" navigation={navigation} />
        })
    }, Conversation: {
        screen: Conversation,
        navigationOptions: ({ navigation }) => ({
            title: 'Someones number/name',
            header: <HeaderConversation navigation={navigation} data={navigation.state.params.data} allowBack={true} />
        })
    }, NewConversation: {
        screen: NewConversation,
        navigationOptions: ({ navigation }) => ({
            title: 'New Conversation',
            header: <Header pageTitle="New Conversation" navigation={navigation} allowBack={true} />
        })
    }, AddContact: {
        screen: AddContact,
        navigationOptions: ({ navigation }) => ({
            title: 'Add Contact',
            header: <Header pageTitle="Add Contact" navigation={navigation} allowBack={true} />
        })
    }
},
    {
        initialRouteName: "Home"
    });

const AuthNavigator = createStackNavigator({
    Login: { screen: Login },
    Signup: { screen: Signup },
    AppNavigator: {
        screen: AppNavigator,
        navigationOptions: {
            header: null,
        }
    }
}, {
    initialRouteName: "Login"
});

const AppContainer = createAppContainer(AuthNavigator);