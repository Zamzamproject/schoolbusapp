import React from 'react'
import { BackHandler, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native'

export default function Welcome({ navigation }) {
    React.useEffect(() => {
        BackHandler.addEventListener('hardwareBackPress', (e) => {
            BackHandler.exitApp()
            return true;
        })
    }, [])
  return (<ScrollView style={{ backgroundColor: "#7f0000", }}>
    <View style={{ width: '75%', alignSelf: 'center' }}>
        <Image source={require("../assets/app_welcome.png")} style={{ resizeMode: "contain", width: '100%', height: 300 }} />
        <Text style={{ color: "#fefcc0", textAlign: "center", fontSize: 26,fontWeight: "bold" }}>School Bus Tracker</Text>


        <TouchableOpacity style={{ backgroundColor: "#fefcc0", width: '100%', borderRadius: 15, padding: 10, color: "#7f0000", marginTop: 65  }} onPress={() => navigation.navigate("Login", { 
            userType: "supervisor"
        })}>
            <Text style={{ color: "#7f0000", textAlign: "center", fontSize: 26,fontWeight: "bold" }}>Supervisor</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ backgroundColor: "#fefcc0", width: '100%', borderRadius: 15, padding: 10, color: "#7f0000", marginTop: 15  }} onPress={() => navigation.navigate("Login", { 
            userType: "parents"
        })}>
            <Text style={{ color: "#7f0000", textAlign: "center", fontSize: 26,fontWeight: "bold" }}>Parents</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ backgroundColor: "#fefcc0", width: '100%', borderRadius: 15, padding: 10, color: "#7f0000", marginTop: 15  }} onPress={() => navigation.navigate("Login", { 
            userType: "drivers"
        })}>
            <Text style={{ color: "#7f0000", textAlign: "center", fontSize: 26,fontWeight: "bold" }}>Drivers</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ backgroundColor: "#fefcc0", width: '100%', borderRadius: 15, padding: 5, color: "#7f0000", marginTop: 45  }} onPress={() => navigation.navigate("Register")}>
            <Text style={{ color: "#7f0000", textAlign: "center", fontSize: 18, fontWeight: "bold" }}>Activate Parent Account</Text>
        </TouchableOpacity>
    </View>
  </ScrollView>
  )
}
