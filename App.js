
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

const defaultHeaderOptions = {
    headerStyle: {
        backgroundColor: '#f4511e',
    },
    headerTintColor: '#fff',
    headerTitleStyle: {
        fontWeight: 'bold',
    },
}

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
    )
}

const AppNavigator = createDrawerNavigator()
const AppDrawer = () => {
    return (
        <AppNavigator.Navigator drawerContent={(props) => <CustomDrawerContent {...props} />}>
            <AppNavigator.Screen name="Foxtrot" component={Home} options={defaultHeaderOptions} />
        </AppNavigator.Navigator>
    )
}

const HomeStack = createStackNavigator();
const HomeNavigator = () => {
    return (
        <HomeStack.Navigator initialRouteName='Home' screenOptions={defaultHeaderOptions}>
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
            <AuthStack.Navigator>
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