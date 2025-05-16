import React from 'react'
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/FontAwesome';

export default function Notifications({ navigation }) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    firestore()
    .collection("notifications")
    .limit(20)
    .get()
    .then(docs => {      
      setLoading(false)
      let tmpArray = [];

      docs.forEach(doc => {
        tmpArray.push({
          id: doc.id,
          ...doc.data()
        })
      })

      setData(tmpArray)
    })
    .catch(err => {      
      setLoading(false)
    })
  }, [])

  return (<ScrollView style={{ backgroundColor: "#7f0000" }}>
    <View style={{ flexDirection: "row", justifyContent: 'space-between', padding: 15 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={26} color="#fefcc0" />
        </TouchableOpacity>
    </View>

    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      {loading && <Image source={require("../assets/loading.gif")} style={{ resizeMode: "contain", width: 30, height: 30, padding: 15, marginLeft: 20, marginTop: 10 }} />}
    </View>

    {data && data.map(item => <View 
      key={item.id}
      style={{ padding: 5, backgroundColor: "#fefcc0", borderRadius: 15, margin: 15,}} 
    >
      <Text style={{ color: "#7f0000", margin: 5, fontSize: 18, fontWeight: "blod" }}>{item.title}</Text>
      <Text style={{ color: "#7f0000", margin: 5, fontSize: 12,  }}>{item.date}</Text>
      <Text style={{ color: "#7f0000", margin: 5, fontSize: 16,  }}>{item.message}</Text>
    </View>)}
  </ScrollView>)
}
