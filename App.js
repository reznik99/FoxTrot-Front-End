
import 'react-native-gesture-handler';
import React from 'react'
import { StatusBar } from 'react-native'
import { Provider } from 'react-redux'
import { Provider as PaperProvider, DefaultTheme, DarkTheme } from 'react-native-paper'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack'
import { createDrawerNavigator } from '@react-navigation/drawer'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faHome } from '@fortawesome/free-solid-svg-icons'

import { store } from './src/store/store'
import { Login, Signup, Home, Conversation, NewConversation, AddContact, Settings } from './src'
import { Drawer, HeaderConversation } from "./src/components"
import { PRIMARY, SECONDARY, SECONDARY_LITE, ACCENT } from './src/global/variables'


const defaultHeaderOptions = {
    headerStyle: {
        backgroundColor: PRIMARY,
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

const HomeStack = createStackNavigator()
const HomeNavigator = () => {
    return (
        <HomeStack.Navigator initialRouteName='Home' screenOptions={{ ...defaultHeaderOptions, ...animationDefaults }}>
            <HomeStack.Screen name="Home" component={AppDrawer} options={{ headerShown: false }} />
            <HomeStack.Screen name="Conversation" component={Conversation} options={({ route }) => ({ header: (props) => (<HeaderConversation navigation={props.navigation} data={props.route.params.data} allowBack={true} />) })} />
            <HomeStack.Screen name="NewConversation" component={NewConversation} options={({ route }) => ({ title: "Contacts" })} />
            <HomeStack.Screen name="AddContact" component={AddContact} options={({ route }) => ({ title: "Search Users" })} />
            <HomeStack.Screen name="Settings" component={Settings} />
        </HomeStack.Navigator>
    )
}

const AuthStack = createStackNavigator()
const AuthNavigator = () => {
    return (
        <NavigationContainer>
            <AuthStack.Navigator screenOptions={{ ...defaultHeaderOptions, ...animationDefaults }}>
                <AuthStack.Screen name="Login" component={Login} options={{ headerShown: false }} />
                <AuthStack.Screen name="Signup" component={Signup} />
                <AuthStack.Screen name="App" component={HomeNavigator} options={{ headerShown: false }} />
            </AuthStack.Navigator>
        </NavigationContainer>
    )
}


const darkTheme = {
    ...DarkTheme,
    roundness: 2,
    colors: {
        ...DarkTheme.colors,
        primary: PRIMARY,
        background: SECONDARY,
        accent: ACCENT,
    },
    dark: true,
};

const defaultTheme = {
    ...DefaultTheme,
    roundness: 2,
    colors: {
        ...DefaultTheme.colors,
        primary: PRIMARY,
        background: SECONDARY_LITE,
        accent: ACCENT,
    },
    dark: false,
};

export default function App() {
    return (
        <Provider store={store}>
            <PaperProvider theme={darkTheme}>
                <StatusBar backgroundColor={PRIMARY} barStyle="light-content" />
                <AuthNavigator />
            </PaperProvider>
        </Provider>
    )
}