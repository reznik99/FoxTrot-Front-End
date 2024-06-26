import 'react-native-gesture-handler'
import React from 'react'
import { StatusBar } from 'react-native'
import { Provider } from 'react-redux'
import { Provider as PaperProvider, DefaultTheme, DarkTheme } from 'react-native-paper'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack'
import { createDrawerNavigator } from '@react-navigation/drawer'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faHome } from '@fortawesome/free-solid-svg-icons'
import Toast from 'react-native-toast-message'

// Crypto
import 'react-native-get-random-values'
import WebviewCrypto from 'react-native-webview-crypto'
window.crypto.getRandomValues = global.crypto.getRandomValues

// App
import { store } from './src/store/store'
import { Login, Signup, Home, Conversation, NewConversation, AddContact, Call, CameraView, Settings } from './src'
import { PRIMARY, SECONDARY, SECONDARY_LITE, ACCENT, DARKHEADER } from './src/global/variables'
import Drawer from '~/components/Drawer'
import HeaderConversation from '~/components/HeaderConversation'


const defaultHeaderOptions = {
    headerStyle: {
        backgroundColor: DARKHEADER,
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
            <HomeStack.Screen name="NewConversation" component={NewConversation} options={({ route }) => ({ title: "My Contacts" })} />
            <HomeStack.Screen name="AddContact" component={AddContact} options={({ route }) => ({ title: "Search New Users" })} />
            <HomeStack.Screen name="Call" component={Call} options={({ route }) => ({ header: (props) => (<HeaderConversation navigation={props.navigation} data={props.route.params.data} allowBack={true} />) })} />
            <HomeStack.Screen name="CameraView" component={CameraView} options={({ route }) => ({ title: "Camera" })} />
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
                <WebviewCrypto />
                <StatusBar backgroundColor={DARKHEADER} barStyle="light-content" />
                <AuthNavigator />
                <Toast />
            </PaperProvider>
        </Provider>
    )
}