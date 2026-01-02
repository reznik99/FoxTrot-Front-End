import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { Provider as PaperProvider, MD2DarkTheme as DarkTheme, Icon } from 'react-native-paper';
import { NavigationContainer, DarkTheme as NavDarkTheme, RouteProp } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators, StackNavigationOptions, StackHeaderProps } from '@react-navigation/stack';
import { createDrawerNavigator, DrawerContentComponentProps, DrawerNavigationOptions } from '@react-navigation/drawer';
import Toast from 'react-native-toast-message';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging'; // Push Notifications
import RNCallKeep, { IOptions as RNCallKeepOpts } from 'react-native-callkeep';
import InCallManager from 'react-native-incall-manager';
import PushNotification from 'react-native-push-notification';
import { Buffer } from 'buffer';
import QuickCrypto from 'react-native-quick-crypto';

// Crypto
import WebviewCrypto from 'react-native-webview-crypto';
global.Buffer = global.Buffer || Buffer;

// App
import { store } from '~/store/store';
import { Login, Signup, Home, Conversation, NewConversation, AddContact, Call, CameraView, Settings } from './src';
import { PRIMARY, SECONDARY, ACCENT, DARKHEADER, VibratePattern } from '~/global/variables';
import Drawer from '~/components/Drawer';
import HeaderConversation from '~/components/HeaderConversation';
import { UserData } from '~/store/reducers/user';
import { deleteFromStorage, writeToStorage } from '~/global/storage';
import { getAvatar } from '~/global/helper';
import { SocketMessage } from '~/store/actions/websocket';

const options: RNCallKeepOpts = {
    android: {
        alertTitle: 'Permissions required',
        alertDescription: 'This application needs to access your phone accounts',
        cancelButton: 'Cancel',
        okButton: 'ok',
        imageName: 'phone_account_icon',
        additionalPermissions: [],
        // Required to get audio in background when using Android 11
        foregroundService: {
            channelId: 'com.foxtrot.callNotifications',
            channelName: 'Foreground service for Foxtrot',
            notificationTitle: 'Foxtrot is running on background',
            // notificationIcon: 'Path to the resource icon of the notification',
        },
    },
    ios: {
        appName: 'Foxtrot'
    }
};

RNCallKeep.setup(options).then(accepted => { });

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
    Call: { data: { peer_user: UserData; video_enabled: boolean } };
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
            <HomeStack.Screen name="Call" component={Call as any} options={renderHeaderConversation} />
            <HomeStack.Screen name="CameraView" component={CameraView} options={{ title: 'Camera' }} />
            <HomeStack.Screen name="Settings" component={Settings} options={{ title: 'Settings' }} />
        </HomeStack.Navigator>
    );
};
const renderHeaderConversation = ({ route }: { route: RouteProp<HomeStackParamList, 'Call' | 'Conversation'> }): StackNavigationOptions => (
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

// Register background handler
const messaging = getMessaging();
setBackgroundMessageHandler(messaging, async remoteMessage => {
    InCallManager.stopRingtone();
    console.log('Message handled in the background!', remoteMessage);
    const callerRaw = remoteMessage.data?.caller as string;
    if (!callerRaw) { return console.error('Caller data is not defined'); }
    // Parse data
    const eventData = JSON.parse(remoteMessage.data?.data as string || '{}') as SocketMessage;
    const caller = JSON.parse(callerRaw) as UserData;
    // Register event handlers
    RNCallKeep.addEventListener('answerCall', (payload) => {
        console.debug('RNCallKeep: User answered call', payload);
        RNCallKeep.backToForeground();
        // Write caller info to special storage key that is checked after app login
        writeToStorage('call_answered_in_background', JSON.stringify({ caller: caller, data: eventData }));
        // User will be opening app and authenticating after this...
    });
    RNCallKeep.addEventListener('endCall', (payload) => {
        console.debug('RNCallKeep: User ended call', payload);
        // Stop ringing and show missed call notification
        InCallManager.stopRingtone();
        PushNotification.createChannel(
            {
                channelId: 'Calls',
                channelName: 'Notifications for missed calls',
                channelDescription: 'Notifications for missed calls',
            },
            () => { },
        );
        PushNotification.localNotification({
            channelId: 'Calls',
            title: 'Missed Call',
            message: `You missed a call from ${caller.phone_no}`,
            when: Date.now() - 20000,
            visibility: 'public',
            picture: caller.pic || getAvatar(caller.id),
            largeIcon: 'foxtrot',
            smallIcon: 'foxtrot',
        });
        // Delete storage info about caller so they don't get routed to call screen on next app open
        deleteFromStorage('call_answered_in_background');
    });

    // Show call notification and start ringing
    InCallManager.startRingtone('_DEFAULT_', VibratePattern, '', 20);
    RNCallKeep.displayIncomingCall(QuickCrypto.randomUUID(), caller.phone_no)
});

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
