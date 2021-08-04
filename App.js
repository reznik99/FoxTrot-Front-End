
import 'react-native-gesture-handler'
import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer'
import { Provider } from 'react-redux'
import { store } from './src/store/store'

import { Login, Signup, Home, Conversation, NewConversation, AddContact } from './src'
import Header from './src/components/Header'
import HeaderConversation from "./src/components/HeaderConversation"

function CustomDrawerContent(props) {
    return (
        <DrawerContentScrollView {...props}>
            <DrawerItemList {...props} />
            <DrawerItem
                inactiveBackgroundColor="#e60e59"
                inactiveTintColor="#fff"
                label="Logout"
                onPress={() => props.navigation.navigate('Login', { data: { loggedOut: true } })}
            />
        </DrawerContentScrollView>
    );
}

const AppNavigator = createDrawerNavigator()
const AppDrawer = () => {
    return (
        <AppNavigator.Navigator drawerContent={(props) => <CustomDrawerContent {...props} />}>
            <AppNavigator.Screen name="Foxtrot" component={Home} />
            {/* <AppNavigator.Screen name="Settings" component={Conversation} />
            <AppNavigator.Screen name="About" component={NewConversation} />
            <AppNavigator.Screen name="Logout" component={AddContact} /> */}
        </AppNavigator.Navigator>
    );
};

const HomeStack = createStackNavigator();
const HomeNavigator = () => {
    return (
        <HomeStack.Navigator initialRouteName='Home'>
            <HomeStack.Screen name="Home" component={AppDrawer} options={{ headerShown: false }} />
            <HomeStack.Screen name="Conversation" component={Conversation} />
            <HomeStack.Screen name="NewConversation" component={NewConversation} />
            <HomeStack.Screen name="AddContact" component={AddContact} />
        </HomeStack.Navigator>
    );
};

const AuthStack = createStackNavigator();
const AuthNavigator = () => {
    return (
        <NavigationContainer>
            <AuthStack.Navigator>
                <AuthStack.Screen name="Login" component={Login} />
                <AuthStack.Screen name="Signup" component={Signup} />
                <AuthStack.Screen name="App" component={HomeNavigator} options={{ headerShown: false }} />
            </AuthStack.Navigator>
        </NavigationContainer>
    );
};


export default function App() {
    return (
        <Provider store={store}>
            <AuthNavigator />
        </Provider>
    );
};




// export default class App extends React.Component {
//     render() {
//         return (
//             <Provider store={store}>
//                 <AppContainer />
//             </Provider>
//         );
//     }
// }
// const AppNavigator = createStackNavigator({
//     Home: {
//         screen: Home,
//         navigationOptions: ({ navigation }) => ({
//             title: 'Conversations', //`${navigation.state.params.name}'s Profile'`,
//             header: <Header pageTitle="Conversations" navigation={navigation} />
//         })
//     }, Conversation: {
//         screen: Conversation,
//         navigationOptions: ({ navigation }) => ({
//             title: 'Someones number/name',
//             header: <HeaderConversation navigation={navigation} data={navigation.state.params.data} allowBack={true} />
//         })
//     }, NewConversation: {
//         screen: NewConversation,
//         navigationOptions: ({ navigation }) => ({
//             title: 'New Conversation',
//             header: <Header pageTitle="New Conversation" navigation={navigation} allowBack={true} />
//         })
//     }, AddContact: {
//         screen: AddContact,
//         navigationOptions: ({ navigation }) => ({
//             title: 'Add Contact',
//             header: <Header pageTitle="Add Contact" navigation={navigation} allowBack={true} />
//         })
//     }
// },
//     {
//         initialRouteName: "Home"
//     });

// const AuthNavigator = createStackNavigator({
//     Login: { screen: Login },
//     Signup: { screen: Signup },
//     AppNavigator: {
//         screen: AppNavigator,
//         navigationOptions: {
//             header: null,
//         }
//     }
// }, {
//     initialRouteName: "Login"
// });

// const AppContainer = createAppContainer(AuthNavigator);