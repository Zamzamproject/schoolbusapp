import React, {useEffect, useState} from 'react';
import {Alert, StatusBar, StyleSheet} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
  DrawerItemList,
} from '@react-navigation/drawer';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';

import Home from './src/components/Home';
import MapContainer from './src/components/MapContainer';
import Login from './src/components/Login';
import Welcome from './src/components/Welcome';
import Driver from './src/components/Driver';
import Notifications from './src/components/Notifications';
import Supervisor from './src/components/Supervisor';
import Splash from './src/components/Splash';
import Register from './src/components/Register';
import ForgetPassword from './src/components/ForgetPassword';
import Scan from './src/components/Scan';
import ChangePassword from './src/components/ChangePassword';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

export default function App() {
  /*
    parimary: "#7f0000",
    secandery: "#fefcc0",
  */
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState();

  // Handle user state changes
  function onAuthStateChanged(user) {
    setUser(user);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  async function requestUserPermission() {
    const authStatus = await messaging().requestPermission()
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      
    if (enabled) {
      //console.log('Authorization status:', authStatus)
    }
  }
  
  useEffect(() => {
    requestUserPermission();
  }, []);
  
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      Alert.alert(remoteMessage.data.title, remoteMessage.data.message, [
        {
          text: "Close",
          onPress: () => {
            //
          },
        },
      ]);
    });

    return unsubscribe;
  }, []);

  
  //if (initializing) return null;

  if (!user) {
    //return <Welcome />;
  }

  const handleSignOut = (props) => {
    props.navigation.navigate("Welcome")
    auth()
      .signOut()
      .then(() => {
        AsyncStorage.clear()
        props.navigation.navigate("Welcome", {screen: "WelcomeScreen"})
      })
      .catch(err =>{
        console.log(err);
      })
  };

  const WelcomeScreens = () => {
    return (
      <Stack.Navigator>
        <Stack.Screen
          name="WelcomeScreen"
          component={Welcome}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Login"
          component={Login}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ForgetPassword"
          component={ForgetPassword}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Register"
          component={Register}
          options={{headerShown: false}}
        />
      </Stack.Navigator>)
  }

  const CustomDrawerContent = props => {
    return (
      <DrawerContentScrollView {...props}>
        <DrawerItemList {...props} />
        <DrawerItem label="ChangePassword" onPress={() => props.navigation.navigate("Change Password")} />
        <DrawerItem label="Sign out" onPress={() => handleSignOut(props)} />
      </DrawerContentScrollView>
    );
  };

  const DriverScreens = () => {
    return (
      <Drawer.Navigator
        screenOptions={{
          drawerStyle: {
            backgroundColor: '#fefcc0',
          },
          drawerLabelStyle: {
            color: '#7f0000',
          },
        }}
        drawerContent={props => <CustomDrawerContent {...props} />}>
        <Drawer.Screen
          name="DriverHome"
          component={Driver}
          options={{headerShown: false, title: 'Home'}}
        />
      </Drawer.Navigator>
    );
  };

  const ParentScreens = () => {
    return (
      <Drawer.Navigator
        screenOptions={{
          drawerStyle: {
            backgroundColor: '#fefcc0',
          },
          drawerLabelStyle: {
            color: '#7f0000',
          },
        }}
        drawerContent={props => <CustomDrawerContent {...props} />}>
        <Drawer.Screen
          name="Home"
          component={Home}
          options={{headerShown: false, title: 'Home'}}
        />
        <Drawer.Screen
          name="Notifications"
          options={{headerShown: false, title: 'Notifications'}}
          component={Notifications}
        />
      </Drawer.Navigator>
    );
  };

  const SupervisorsScreen = () => {
    return (
      <Drawer.Navigator
        screenOptions={{
          drawerStyle: {
            backgroundColor: '#fefcc0',
          },
          drawerLabelStyle: {
            color: '#7f0000',
          },
        }}
        drawerContent={props => <CustomDrawerContent {...props} />}>
        <Drawer.Screen
          name="SupervisorHome"
          component={Supervisor}
          options={{headerShown: false, title: 'Home'}}
        />
      </Drawer.Navigator>
    );
  };

  return (
    <SafeAreaProvider>
      <StatusBar backgroundColor={'#7f0000'} />

      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="Splash"
            component={Splash}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="DriverScreens"
            component={DriverScreens}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Welcome"
            component={WelcomeScreens}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Supervisor"
            component={SupervisorsScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Scan"
            component={Scan}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Change Password"
            component={ChangePassword}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Parents Home"
            component={ParentScreens}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Map"
            component={MapContainer}
            options={{headerShown: false}}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});
