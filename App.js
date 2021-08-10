
import 'react-native-gesture-handler'
import React from 'react'
import { ScrollView, SafeAreaView } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer'
import { Provider } from 'react-redux'
import { store } from './src/store/store'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faDoorOpen, faHome, faCog } from '@fortawesome/free-solid-svg-icons'
import { Login, Signup, Home, Conversation, NewConversation, AddContact } from './src'
import HeaderConversation from "./src/components/HeaderConversation"

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

function CustomDrawerContent(props) {
    return (
        <DrawerContentScrollView contentContainerStyle={{ height: '100%', backgroundColor: "#222" }} {...props}>
            <ScrollView contentContainerStyle={{ flex: 1, flexDirection: 'column' }}>
                <SafeAreaView forceInset={{ top: 'always', horizontal: 'never' }}>
                    <DrawerItemList {...props} />
                </SafeAreaView>
                <DrawerItem

                    inactiveTintColor="#aaf"
                    label="Settings"
                    onPress={() => props.navigation.navigate('Login', { data: { loggedOut: true } })}
                    icon={({ focused, size, color }) => (
                        <FontAwesomeIcon size={size} icon={faCog} style={{ color: color }} />
                    )}
                />
                <DrawerItem
                    inactiveTintColor="#e60e59"
                    label="Logout"
                    style={{ borderBottomWidth: 1, borderBottomColor: "#e60e59" }}
                    onPress={() => props.navigation.navigate('Login', { data: { loggedOut: true } })}
                    icon={({ focused, size, color }) => (
                        <FontAwesomeIcon size={size} icon={faDoorOpen} style={{ color: color }} />
                    )}
                />
            </ScrollView>
        </DrawerContentScrollView>
    )
}

const AppNavigator = createDrawerNavigator()
const AppDrawer = () => {
    return (
        <AppNavigator.Navigator screenOptions={{ swipeEdgeWidth: 200 }}
            drawerContent={(props) => <CustomDrawerContent {...props} />} >
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