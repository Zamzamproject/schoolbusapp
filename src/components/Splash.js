import React from 'react'
import { Image, ScrollView, View } from 'react-native'
import { useAsyncStorage } from '@react-native-async-storage/async-storage';

export default function Splash({ navigation }) {
    const { getItem, setItem } = useAsyncStorage('@user_type');

    React.useEffect(() => {
        checkUserType()
    }, [])

    const checkUserType = async () => {
        const userType = await getItem();
        
        switch(userType){
            case "supervisor":
              navigation.navigate("Supervisor")
            break;
            case "parents":
              navigation.navigate("Parents Home")
            break;
            case "drivers":
              navigation.navigate("DriverScreens")
            break;
            
            default:
              console.log('default');
              
              navigation.navigate("Welcome")
        }
    }
    
  return (<ScrollView style={{ backgroundColor: "#7f0000" }}>
    <View style={{ flex: 1, justifyContent: "center", alignItems: 'center' }}>
        <Image source={require("../assets/welcomebustlogo.gif")} style={{ resizeMode: 'contain', width: 200, height: 200, marginTop: '55%' }} />
    </View>
  </ScrollView>)
}
