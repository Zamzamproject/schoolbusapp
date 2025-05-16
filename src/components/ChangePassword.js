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

export default function ChangePassword({route, navigation}) {
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [passwordEye, setPasswordEye] = useState(true);
  const [newPasswordEye, setNewPasswordEye] = useState(true);

  const handleChangePassword = () => {
    if (password == '' || oldPassword == '') {
      setMessage('Enter password.');
    } else if (password.length < 8) {
      setMessage('Password length should be 8 charachers');
    } else {
      console.log(auth().currentUser);
      //auth.EmailAuthProvider.credential(auth().currentUser.email)
      const emailCred = auth.EmailAuthProvider.credential(
        auth().currentUser.email,
        oldPassword,
      );

      auth()
        .currentUser.reauthenticateWithCredential(emailCred)
        .then(() => {
          auth()
            .currentUser.updatePassword(password)
            .then(() => {
              setMessage('Password has been changes successfully!');
            })
            .catch(error => {
              setMessage('Sorry, something went wrong...');
            });
        })
        .catch(err => {
          console.log(err);
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
          Change your Password
        </Text>
        <Text style={{fontSize: 30, color: '#fefcc0', margin: 10}}>
          Old Password
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
              width: '100%',
              borderRadius: 15,
              padding: 20,
              color: '#7f0000',
            }}
            onChangeText={setOldPassword}
            value={oldPassword}
            secureTextEntry
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
          New Password
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
              width: '100%',
              borderRadius: 15,
              padding: 20,
              color: '#7f0000',
            }}
            onChangeText={setPassword}
            value={password}
            secureTextEntry
          />
          <TouchableOpacity onPress={() => setNewPasswordEye(!newPasswordEye)}>
            <Icon
              name={newPasswordEye ? 'eye' : 'eye-slash'}
              color="#7f0000"
              size={25}
              padding={20}
            />
          </TouchableOpacity>
        </View>
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
          onPress={handleChangePassword}>
          <Text style={{color: '#7f0000', textAlign: 'center', fontSize: 26}}>
            Change Password
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
