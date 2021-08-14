import React from 'react'
import { ScrollView, View, Text } from 'react-native'
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer'
import { useSelector } from 'react-redux'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faDoorOpen, faCog, faUser, faPhoneAlt, faLock } from '@fortawesome/free-solid-svg-icons'
import { ActivityIndicator, Avatar } from 'react-native-paper'

const styles = {
    profileContainer: {
        flex: 0,
        flexDirection: "column",
        alignItems: "center",
        paddingVertical: 30
    },
    profileInfoContainer: {
        flex: 0,
        marginVertical: 10,
        flexDirection: "row",
        textAlign: "right",
        alignItems: "center"
    },
    profileInfo: {
        color: "#fff"
    },
    profileInfoIcon: {
        color: "#fff",
        marginRight: 10,
    }
}

export default function Drawer(props) {
    const state = useSelector(state => state.userReducer)

    return (
        <DrawerContentScrollView contentContainerStyle={{ height: '100%', backgroundColor: "#222" }} {...props}>
            <ScrollView contentContainerStyle={{ flex: 1, flexDirection: 'column' }}>
                {/* <SafeAreaView forceInset={{ top: 'always', horizontal: 'never' }}>
                    <DrawerItemList {...props} />
                </SafeAreaView> */}

                <View style={styles.profileContainer}>
                    <Avatar.Image size={150}
                        source={{ uri: `https://robohash.org/${state.user_data?.phone_no}` }}
                        PlaceholderContent={<ActivityIndicator color="#00FFFF" />} />
                    <View>
                        <View style={styles.profileInfoContainer}>
                            <FontAwesomeIcon size={15} icon={faPhoneAlt} style={styles.profileInfoIcon} />
                            <Text style={styles.profileInfo}> {state.user_data?.phone_no}</Text>
                        </View>
                        <View style={styles.profileInfoContainer}>
                            <FontAwesomeIcon size={18} icon={faUser} style={styles.profileInfoIcon} />
                            <Text style={styles.profileInfo}>Contacts: {state.contacts?.length}</Text>
                        </View>
                        <View style={styles.profileInfoContainer}>
                            <FontAwesomeIcon size={18} icon={faLock} style={styles.profileInfoIcon} />
                            <Text style={styles.profileInfo}>Keys: RSA {state.keys?.private?.length}</Text>
                        </View>
                    </View>
                </View>

                <DrawerItem
                    inactiveTintColor="#aaf"
                    label="Settings"
                    onPress={() => props.navigation.navigate('Settings')}
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