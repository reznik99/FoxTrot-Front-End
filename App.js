
import 'react-native-gesture-handler'
import React from 'react'
import { ScrollView, View, Text } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack'
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer'
import { Provider, useSelector } from 'react-redux'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faDoorOpen, faHome, faCog, faUser, faPhoneAlt } from '@fortawesome/free-solid-svg-icons'
import { ActivityIndicator, Avatar } from 'react-native-paper'

import { store } from './src/store/store'
import { Login, Signup, Home, Conversation, NewConversation, AddContact } from './src'
import HeaderConversation from "./src/components/HeaderConversation"
import Drawer from "./src/components/Drawer"


const defaultHeaderOptions = {
    headerStyle: {
        backgroundColor: '#f4511e',
    },
    headerTintColor: '#fff',
    headerTitleStyle: {
        fontWeight: 'bold',
    },
    drawerIcon: ({ focused, size, color }) => (
        <FontAwesomeIcon size={size} icon={faHome} style={{ color: color }} />
    )
}
const animationDefaults = {
    cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
    gestureEnabled: true,
    gestureDirection: 'horizontal'
}

const AppNavigator = createDrawerNavigator()
const AppDrawer = () => {
    return (
        <AppNavigator.Navigator screenOptions={{ swipeEdgeWidth: 200 }}
            drawerContent={(props) => <Drawer {...props} />} >
            <AppNavigator.Screen name="Foxtrot" component={Home} options={defaultHeaderOptions} />
        </AppNavigator.Navigator>
    )
}

const HomeStack = createStackNavigator();
const HomeNavigator = () => {
    return (
        <HomeStack.Navigator initialRouteName='Home' screenOptions={{ ...defaultHeaderOptions, ...animationDefaults }}>
            <HomeStack.Screen name="Home" component={AppDrawer} options={{ headerShown: false }} />
            <HomeStack.Screen name="Conversation" component={Conversation} options={({ route }) => ({ header: (props) => (<HeaderConversation navigation={props.navigation} data={props.route.params.data} allowBack={true} />) })} />
            <HomeStack.Screen name="NewConversation" component={NewConversation} options={({ route }) => ({ title: "Contacts" })} />
            <HomeStack.Screen name="AddContact" component={AddContact} options={({ route }) => ({ title: "Search Users" })} />
        </HomeStack.Navigator>
    )
}

const AuthStack = createStackNavigator();
const AuthNavigator = () => {
    return (
        <NavigationContainer>
            <AuthStack.Navigator screenOptions={animationDefaults}>
                <AuthStack.Screen name="Login" component={Login} options={{ headerShown: false }} />
                <AuthStack.Screen name="Signup" component={Signup} />
                <AuthStack.Screen name="App" component={HomeNavigator} options={{ headerShown: false }} />
            </AuthStack.Navigator>
        </NavigationContainer>
    )
}


export default function App() {
    return (
        <Provider store={store}>
            <AuthNavigator />
        </Provider>
    )
}