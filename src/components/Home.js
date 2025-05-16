import React from 'react';
import {
  BackHandler,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/FontAwesome';
import messaging from '@react-native-firebase/messaging';

export default function Home({navigation}) {
  const [data, setData] = React.useState(null);
  const [studentsList, setStudentsList] = React.useState(null);
  const [students, setStudents] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [busesList, setBusesList] = React.useState(null);
  const [show, setShow] = React.useState(false);
  const [busId, setBusId] = React.useState(null);
  const [user_id, setUser] = React.useState();
  const [parentId, setParentId] = React.useState();

  React.useEffect(() => {
    if (parentId) {
      messaging()
        .getToken()
        .then(token => {
          if (token) {
            firestore();
            firestore()
              .collection('parents')
              .doc(parentId)
              .update({
                token: token,
              })
              .then(res => {
                //
              })
              .catch(err => {
                //console.log(err);
              });
          }
        })
        .catch(err => {
          //console.log(err);
        });
    }
  }, [parentId]);

  const onAuthStateChanged = user => {
    if (user) {
      setUser(user);
      firestore()
        .collection('parents')
        .where('user_id', '==', user.uid)
        .get()
        .then(res => {
          let tmpArr = [];
          res.forEach(doc => {
            tmpArr.push({
              id: doc.id,
              ...doc.data(),
            });
          });
          if (tmpArr.length != 0) {
            setData(tmpArr[0]);
            loadStudents(tmpArr[0].id);
            setParentId(tmpArr[0].id);
          }
        })
        .catch(err => {
          console.log(err);
        });
    }
  };

  React.useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  React.useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', e => {
      BackHandler.exitApp();
      return true;
    });
  }, []);

  const loadStudents = user => {
    if (user) {
      firestore()
        .collection('students')
        .where('parent_id', '==', user)
        .get()
        .then(docs => {
          setLoading(false);
          let tmpStudents = [];
          let tmpBuses = [];

          docs.forEach(doc => {
            if (doc.data().position) {
              const currentDate = new Date();
              const startOfDay = new Date(currentDate.setHours(0, 0, 0, 0)); // Set to the start of the current day (midnight)
              const endOfDay = new Date(currentDate.setHours(23, 59, 59, 999)); // Set to the end of the current day (11:59:59 PM)

              const boarding_time = doc.data().boarding_time
                ? doc.data().boarding_time.toDate()
                : null;
              const get_off_time = doc.data().get_off_time
                ? doc.data().get_off_time.toDate()
                : null;

              tmpStudents.push({
                id: doc.id,
                ...doc.data(),
                boarding_time:
                  boarding_time &&
                  boarding_time >= startOfDay &&
                  boarding_time <= endOfDay
                    ? boarding_time.toLocaleTimeString('en-GB')
                    : '',

                get_off_time:
                  get_off_time &&
                  get_off_time >= startOfDay &&
                  get_off_time <= endOfDay
                    ? get_off_time.toLocaleTimeString('en-GB')
                    : '',
              });
            }
            let found = tmpBuses.filter(item => item == doc.data().bus_id);
            if (found.length == 0) {
              tmpBuses.push(doc.data().bus_id);
            }
          });
          setStudents(tmpStudents);
          setStudentsList(tmpStudents);
          setBusesList(tmpBuses);
        })
        .catch(err => {
          setLoading(false);
        });
    }
  };

  React.useEffect(() => {
    if (busId) {
      let tmpArr = studentsList.filter(item => item.bus_id == busId);

      setStudents(tmpArr);
    }
  }, [busId]);

  return (
    <ScrollView style={{backgroundColor: '#7f0000'}}>
      <Modal
        animationType="fade"
        transparent={true}
        visible={show}
        onRequestClose={() => {
          setShow(false);
        }}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <View
            style={{
              margin: 20,
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 35,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 5,
            }}>
            {busesList &&
              busesList.map((item, index) => (
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    width: 200,
                    borderBottomColor: '#ccc',
                    borderBottomWidth: 1,
                    padding: 15,
                  }}
                  key={'bus-' + index}
                  onPress={() => {
                    setBusId(item);
                    setShow(false);
                  }}>
                  <Text style={{color: '#000', fontWeight: 'bold'}}>
                    {index + 1} -{' '}
                  </Text>
                  <Text
                    style={{
                      color: '#000',
                      fontWeight: 'bold',
                    }}>
                    Bus - {item}
                  </Text>
                </TouchableOpacity>
              ))}
            <TouchableOpacity
              style={{
                borderRadius: 20,
                padding: 10,
                margin: 15,
              }}
              onPress={() => setShow(false)}>
              <Text
                style={{
                  textAlign: 'center',
                }}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          padding: 15,
        }}>
        <TouchableOpacity onPress={() => navigation.toggleDrawer()}>
          <Icon name="bars" size={26} color="#fefcc0" />
        </TouchableOpacity>
        <Text
          style={{color: '#fff', margin: 5, fontSize: 20, color: '#fefcc0'}}>
          Parents Portal
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
          <Icon name="bell" size={26} color="#fefcc0" />
        </TouchableOpacity>
      </View>

      <Text
        style={{
          color: '#fff',
          margin: 15,
          fontSize: 26,
          color: '#fefcc0',
          textAlign: 'center',
        }}>
        Welcome, {data && data.first_name} {data && data.last_name}
      </Text>

      <TouchableOpacity style={{padding: 15}} onPress={() => setShow(true)}>
        <Text
          style={{color: '#fff', margin: 5, fontSize: 26, color: '#fefcc0'}}>
          Buses List <Icon name="caret-down" size={26} color="#fefcc0" />
        </Text>
      </TouchableOpacity>

      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        {loading && (
          <Image
            source={require('../assets/loading.gif')}
            style={{
              resizeMode: 'contain',
              width: 30,
              height: 30,
              padding: 15,
              marginLeft: 20,
              marginTop: 10,
            }}
          />
        )}
      </View>

      {students &&
        students.map(item => (
          <TouchableOpacity
            key={item.id}
            style={{
              padding: 5,
              flex: 1,
              flexDirection: 'row',
              backgroundColor: '#fefcc0',
              borderRadius: 15,
              margin: 15,
              flexDirection: 'row',
            }}
            onPress={() =>
              navigation.navigate('Map', {
                bus_id: item.bus_id,
                student_id: item.id,
              })
            }>
            <Image
              source={{
                uri:
                  'https://firebasestorage.googleapis.com/v0/b/schoolbustracker-11ddd.appspot.com/o/images%2F' +
                  item.image +
                  '?alt=media',
              }}
              style={{resizeMode: 'contain', width: 100, height: 100}}
            />
            <View>
              <Text style={{color: '#7f0000', margin: 5, fontSize: 16}}>
                Name: {item.first_name} {item.last_name}
              </Text>
              <Text style={{color: '#7f0000', margin: 5, fontSize: 16}}>
                ID: {item.student_id}
              </Text>
              <Text style={{color: '#7f0000', margin: 5, fontSize: 16}}>
                Bus No.: {item.bus_id}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
    </ScrollView>
  );
}
