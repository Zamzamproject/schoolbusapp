import React, {useState} from 'react';
import {
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import database from '@react-native-firebase/database';
import QRCodeScanner from 'react-native-qrcode-scanner';
import {RNCamera} from 'react-native-camera';

export default function Scan({navigation, route}) {
  const {bus_id} = route.params;
  const [studentBus, setStudentBus] = useState('null');

  const handleCheckin = e => {
    let val = e.data;
    let enableAlert = true;
    if (val != '') {
      database()
        .ref('/students')
        .once('value')
        .then(snapshots => {
          snapshots.forEach(snapshot => {
            if (snapshot.val().student_id == val) {
              enableAlert = false;
              checkStudentBus(snapshot.val().present, snapshot.val().student_id, snapshot.key);
            }
          });

          if(enableAlert) {
            Alert.alert(
              'Wrong Bus ID',
              `This student is not affilate in this bus.`,
              [
                {
                  text: 'Close',
                  onPress: () => navigation.goBack(),
                  style: 'cancel',
                },
                {
                  text: 'Try again',
                  onPress: () => console.log('OK Pressed'),
                },
              ],
            );
          }
        })
        .catch(err => {
          console.log(err);
        });
    }
  };

  const checkStudentBus = (checkin, student_id, rtdb_id) => {
    firestore()
      .collection('students')
      .doc(student_id)
      .get()
      .then(sdoc => {
        if(sdoc && sdoc.data() && sdoc.data().bus_id){
          setStudentBus(sdoc.data().bus_id)
        }
        if (sdoc.data() && sdoc.data().bus_id == bus_id) {          
          database()
            .ref('/students/' + rtdb_id)
            .update({
              present: !checkin,
              method: "QR Code"
            })
            .then(() => {              
              navigation.navigate('DriverScreens');
            })
            .catch(err => {
              navigation.navigate('DriverScreens');
            });
        } else {
          Alert.alert(
            'Wrong Bus ID',
            `This student is not affilate in this bus. student bus ID is ${sdoc.data().bus_id}`,
            [
              {
                text: 'Close',
                onPress: () => navigation.goBack(),
                style: 'cancel',
              },
              {
                text: 'Try again',
                onPress: () => console.log('OK Pressed'),
              },
            ],
          );
        }
      })
      .catch(err => {
        console.log(err);
        Alert.alert(
          'Wrong Bus ID',
          `This student is not affilate in this bus.`,
          [
            {
              text: 'Close',
              onPress: () => navigation.goBack(),
              style: 'cancel',
            },
            {
              text: 'Try again',
              onPress: () => console.log('OK Pressed'),
            },
          ],
        );
      });
  };

  return (
    <QRCodeScanner
      onRead={handleCheckin}
      flashMode={RNCamera.Constants.FlashMode.auto}
      reactivate={false}
      topContent={
        <TouchableOpacity
          style={{
            position: 'absolute',
            zIndex: 1,
            marginTop: 35,
            margin: 15,
            padding: 10,
            borderRadius: 15,
            backgroundColor: '#fefcc0',
            marginTop: '25%',
          }}
          onPress={() => navigation.goBack()}>
          <Text style={{ color: "#000" }}>x Close</Text>
        </TouchableOpacity>
      }
      cameraStyle={{flex: 1, height: '100%'}}
      /*bottomContent={
        <TouchableOpacity>
          <Text>OK. Got it!</Text>
        </TouchableOpacity>
      }*/
    />
  );
}
