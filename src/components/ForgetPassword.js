import React, {useState} from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/FontAwesome';

export default function ForgetPassword({route, navigation}) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const {userType} = route.params;

  const handleForgetPassword = () => {
    if(email == ""){
        setMessage("Enter your email.")
    } else {
        firestore()
          .collection(userType)
          .where('email', '==', email)
          .get()
          .then(res => {
            if(res.docs.length != 0){
                auth()
                  .sendPasswordResetEmail(email)
                  .then(async () => {
                    setMessage("Check your email! We've sened you an email to reset your password!");
                  })
                  .catch(error => {
                    if (error.code === 'auth/email-already-in-use') {
                      setMessage('wrong email or password!');
                    } else if (error.code === 'auth/invalid-email') {
                      setMessage('That email address is invalid!');
                    } else {
                        setMessage("Sorry, something went wrong...");
                    }
                  });
            } else {
                setMessage('That email address is invalid!');
            }
          })
          .catch(error => {
            setMessage("Sorry, something went wrong...");
          });
    }
  };
  return (
    <ScrollView style={{backgroundColor: '#7f0000'}}>
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
      }}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Icon name="arrow-left" size={26} color="#fefcc0" />
      </TouchableOpacity>
    </View>

      <View style={{width: '75%', alignSelf: 'center'}}>
        <Text
          style={{
            fontSize: 30,
            color: '#fefcc0',
            //marginTop: 75,
            marginBottom: 50,
          }}>
          Reset Your Password
        </Text>
        <Text style={{fontSize: 30, color: '#fefcc0', margin: 10}}>E-mail</Text>
        <TextInput
          style={{
            backgroundColor: '#fefcc0',
            width: '100%',
            borderRadius: 15,
            padding: 20,
            color: '#7f0000',
          }}
          onChangeText={setEmail}
        />
        <Text style={{ fontSize: 14, textAlign: "center", color: "#fefcc0", margin: 5, padding: 5 }}>{message}</Text>
        <TouchableOpacity
          style={{
            backgroundColor: '#fefcc0',
            width: '100%',
            borderRadius: 15,
            padding: 10,
            color: '#7f0000',
            //marginTop: 65,
          }}
          onPress={handleForgetPassword}>
          <Text style={{color: '#7f0000', textAlign: 'center', fontSize: 26}}>
            Reset Password
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
