import React, {useState} from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/FontAwesome';
import firestore from '@react-native-firebase/firestore';
import {useAsyncStorage} from '@react-native-async-storage/async-storage';

export default function Login({route, navigation}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordEye, setPasswordEye] = useState(true);
  const [message, setMessage] = useState(null);
  const {getItem, setItem} = useAsyncStorage('@user_type');
  const {userType} = route.params;

  const handleSignin = () => {
    let collection = 'parents';
    if (userType == 'supervisor') {
      collection = 'supervisors';
    } else if (userType == 'drivers') {
      collection = 'drivers';
    }
    auth()
      .signInWithEmailAndPassword(email, password)
      .then(data => {
        if (userType == 'parents') {
          firestore()
            .collection('parents')
            .where('user_id', '==', data.user.uid)
            .get()
            .then(res => {
              if (res.docs.length != 0) {
                navigation.navigate('Parents Home');
              } else {
                auth()
                  .signOut()
                  .then(res => {
                    navigation.navigate('Welcome', {screen: 'WelcomeScreen'});
                  })
                  .catch(err => {
                    setMessage('Sorry, something went wrong...');
                  });
              }
            })
            .catch(err => {
              console.log(err);
              setMessage('Sorry, something went wrong...');
            });
        } else {
          firestore()
            .collection(collection)
            .doc(data.user.uid)
            .get()
            .then(async res => {
              if (res.data()) {
                if (userType == 'supervisor') {
                  navigation.navigate('Supervisor');
                } else {
                  navigation.navigate('DriverScreens');
                }

                await setItem(userType);
              } else {
                auth()
                  .signOut()
                  .then(res => {
                    navigation.navigate('Welcome', {screen: 'WelcomeScreen'});
                  })
                  .catch(err => {
                    setMessage('Sorry, something went wrong...');
                  });
              }
            })
            .catch(err => {
              setMessage('Sorry, something went wrong...');
            });
        }
      })
      .catch(error => {
        if (error.code === 'auth/email-already-in-use') {
          setMessage('wrong email or password!');
        } else if (error.code === 'auth/invalid-email') {
          setMessage('That email address is invalid!');
        } else {
          setMessage('Wrong email or password...');
        }
      });
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
            fontSize: 45,
            color: '#fefcc0',
            marginTop: 75,
            marginBottom: 50,
          }}>
          Welcome...
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
              name={passwordEye ? 'eye-slash' : 'eye'}
              color="#7f0000"
              size={25}
              padding={20}
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('ForgetPassword', {userType: userType})
          }>
          <Text
            style={{
              fontSize: 20,
              color: '#fefcc0',
              margin: 10,
              fontWeight: 'bold',
              alignSelf: 'center',
            }}>
            Forget Password
          </Text>
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 14,
            textAlign: 'center',
            color: '#fefcc0',
            margin: 5,
            padding: 5,
          }}>
          {message}
        </Text>

        <TouchableOpacity
          style={{
            backgroundColor: '#fefcc0',
            width: '100%',
            borderRadius: 15,
            padding: 10,
            color: '#7f0000',
            //marginTop: 65,
          }}
          onPress={handleSignin}>
          <Text style={{color: '#7f0000', textAlign: 'center', fontSize: 26}}>
            Sign In
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
