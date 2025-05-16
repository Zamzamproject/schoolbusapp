import React, {useState} from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import firestore, { doc, updateDoc } from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/FontAwesome';
import {useAsyncStorage} from '@react-native-async-storage/async-storage';

export default function Register({route, navigation}) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [passwordEye, setPasswordEye] = useState(true);
  const {getItem, setItem} = useAsyncStorage('@user_type');

  const handleCreateAccount = () => {
    if(repeatPassword !== password){
        setMessage("Password dones not match..");
    } else if(password.length < 8){
      setMessage("Password length should be 8 characters or grater..");
    } else if(email == "" || password == ""){
        setMessage("Enter your email and password.");
    } else {
        firestore()
          .collection('parents')
          .where('email', '==', email)
          .get()
          .then(res => {            
            if(res.docs.length != 0){
            auth()
              .createUserWithEmailAndPassword(email, password)
              .then(async (userData) => {
                await setItem('parents');
                firestore()
                  .collection('parents')
                  .doc(res.docs[0].id)
                  .update({
                    user_id: userData.user.uid
                  })
                  .then(() => {
                    navigation.navigate('Parents Home');
                  })
                  .catch(() => {
                    //
                  })

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
          Active Your account
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
        <Text style={{fontSize: 30, color: '#fefcc0', margin: 10}}>
          Password
        </Text>
        <View
          style={{
            backgroundColor: '#fefcc0',
            width: '100%',
            flexDirection: 'row',
            borderRadius: 15,
          }}>
          <TextInput
            style={{
              backgroundColor: '#fefcc0',
              width: '80%',
              padding: 20,
              color: '#7f0000',
              borderRadius: 15,
            }}
            secureTextEntry={passwordEye}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setPasswordEye(!passwordEye)}>
            <Icon
              name={passwordEye ? 'eye' : 'eye-slash'}
              color="#7f0000"
              size={25}
              padding={20}
            />
          </TouchableOpacity>
        </View>
        <Text style={{fontSize: 30, color: '#fefcc0', margin: 10}}>
          Repeat Password
        </Text>
        <View
          style={{
            backgroundColor: '#fefcc0',
            width: '100%',
            flexDirection: 'row',
            borderRadius: 15,
          }}>
          <TextInput
            style={{
              backgroundColor: '#fefcc0',
              width: '80%',
              padding: 20,
              color: '#7f0000',
              borderRadius: 15,
            }}
            secureTextEntry={passwordEye}
            onChangeText={setRepeatPassword}
          />
          <TouchableOpacity onPress={() => setPasswordEye(!passwordEye)}>
            <Icon
              name={passwordEye ? 'eye' : 'eye-slash'}
              color="#7f0000"
              size={25}
              padding={20}
            />
          </TouchableOpacity>
        </View>

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
          onPress={handleCreateAccount}>
          <Text style={{color: '#7f0000', textAlign: 'center', fontSize: 26}}>
            Account Activate
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
