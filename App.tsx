import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { Provider as PaperProvider, MD2DarkTheme as DarkTheme, Icon } from 'react-native-paper';
import { NavigationContainer, DarkTheme as NavDarkTheme, RouteProp } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators, StackNavigationOptions, StackHeaderProps } from '@react-navigation/stack';
import { createDrawerNavigator, DrawerContentComponentProps, DrawerNavigationOptions } from '@react-navigation/drawer';
import Toast from 'react-native-toast-message';

// Crypto
import 'react-native-get-random-values';
import WebviewCrypto from 'react-native-webview-crypto';
window.crypto.getRandomValues = globalThis.crypto.getRandomValues;

// App
import { store } from '~/store/store';

import { Login, Signup, Home, Conversation, NewConversation, AddContact, Call, CameraView, Settings } from './src';
import { PRIMARY, SECONDARY, ACCENT, DARKHEADER } from '~/global/variables';
import Drawer from '~/components/Drawer';
import HeaderConversation from '~/components/HeaderConversation';
import { UserData } from '~/store/reducers/user';

const defaultHeaderOptions: StackNavigationOptions & DrawerNavigationOptions = {
    headerStyle: {
        backgroundColor: DARKHEADER,
    },
    headerTintColor: '#fff',
    headerTitleStyle: {
        fontWeight: 'bold',
    },
    drawerIcon: ({ color }) => (
        <Icon source="home" color={color} size={20} />
    ),
};
const animationDefaults: StackNavigationOptions = {
    cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
    gestureEnabled: true,
    gestureDirection: 'horizontal',
};

export type RootDrawerParamList = {
    FoxTrot: undefined;
};
const AppNavigator = createDrawerNavigator<RootDrawerParamList>();
const AppDrawer = () => {
    return (
        <AppNavigator.Navigator
            screenOptions={{ swipeEdgeWidth: 200 }}
            drawerContent={renderDrawerContent} >
            <AppNavigator.Screen name="FoxTrot" component={Home} options={defaultHeaderOptions} />
        </AppNavigator.Navigator>
    );
};
const renderDrawerContent = (props: DrawerContentComponentProps) => (
    <Drawer {...props} />
);

export type HomeStackParamList = {
    Home: undefined;
    Conversation: { data: { peer_user: UserData; } };
    NewConversation: undefined;
    AddContact: undefined;
    Call: { data: { peer_user: UserData } };
    CameraView: { data: { peer: UserData, picturePath: string } };
    Settings: undefined;
};
const HomeStack = createStackNavigator<HomeStackParamList>();
const HomeNavigator = () => {
    return (
        <HomeStack.Navigator initialRouteName="Home" screenOptions={{ ...defaultHeaderOptions, ...animationDefaults }}>
            <HomeStack.Screen name="Home" component={AppDrawer} options={{ headerShown: false }} />
            <HomeStack.Screen name="Conversation" component={Conversation} options={renderHeaderConversation} />
            <HomeStack.Screen name="NewConversation" component={NewConversation} options={{ title: 'My Contacts' }} />
            <HomeStack.Screen name="AddContact" component={AddContact} options={{ title: 'Search New Users' }} />
            <HomeStack.Screen name="Call" component={Call} options={renderHeaderConversation} />
            <HomeStack.Screen name="CameraView" component={CameraView} options={{ title: 'Camera' }} />
            <HomeStack.Screen name="Settings" component={Settings} options={{ title: 'Settings' }} />
        </HomeStack.Navigator>
    );
};
const renderHeaderConversation = ({ route }: { route: RouteProp<HomeStackParamList, 'Call' | 'Conversation'> }) => (
    {
        header: (props: StackHeaderProps) => (
            <HeaderConversation navigation={props.navigation as any} data={route.params.data} allowBack={true} />
        ),
    }
);

export type AuthStackParamList = {
    Login: { data: { errorMsg: string; loggedOut: boolean; } };
    Signup: undefined;
    App: undefined;
};
const AuthStack = createStackNavigator<AuthStackParamList>();
const AuthNavigator = () => {
    return (
        <NavigationContainer theme={NavDarkTheme}>
            <AuthStack.Navigator screenOptions={{ ...defaultHeaderOptions, ...animationDefaults }}>
                <AuthStack.Screen name="Login" component={Login} options={{ headerShown: false }} />
                <AuthStack.Screen name="Signup" component={Signup} />
                <AuthStack.Screen name="App" component={HomeNavigator} options={{ headerShown: false }} />
            </AuthStack.Navigator>
        </NavigationContainer>
    );
};


const darkTheme = {
    ...DarkTheme,
    colors: {
        ...DarkTheme.colors,
        primary: PRIMARY,
        background: SECONDARY,
        accent: ACCENT,
    },
    dark: true,
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
    );
}
