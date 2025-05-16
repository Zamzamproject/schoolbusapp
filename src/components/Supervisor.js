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
import {LeafletView} from 'react-native-leaflet-view';
import database from '@react-native-firebase/database';
import messaging from '@react-native-firebase/messaging';

export default function Supervisor({navigation}) {
  const [data, setData] = React.useState(null);
  const [studentsList, setStudentsList] = React.useState(null);
  const [studentsReady, setStudentsReady] = React.useState(false);
  const [students, setStudents] = React.useState(null);
  const [busId, setBusId] = React.useState(null);
  const [busesList, setBusesList] = React.useState(null);
  const [user, setUser] = React.useState(null);
  const [show, setShow] = React.useState(false);
  const [updated, setUpdated] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [busData, setBusData] = React.useState(null);
  const [timeEstimated, setTimeEstimated] = React.useState({});

  React.useEffect(() => {
    if (user) {
      messaging()
        .getToken()
        .then(token => {
          if (token) {
            firestore()
              .collection('supervisors')
              .doc(user.uid)
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
  }, [user]);

  // Handle user state changes
  const onAuthStateChanged = user => {
    if (user) {
      setUser(user);
      firestore()
        .collection('supervisors')
        .doc(user.uid)
        .get()
        .then(doc => {
          setData(doc.data());
        })
        .catch(err => {
          //console.log(err);
        });
    }
  };

  React.useEffect(() => {
    firestore()
      .collection('buses')
      .get()
      .then(res => {
        let tmpArr = [];
        res.forEach(doc => {
          tmpArr.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        setBusesList(tmpArr);
      })
      .catch(err => {
        //console.log(err);
      });
  }, []);

  React.useEffect(() => {
    if (students) {
      const seatsChange = database()
        .ref('/students')
        .on('value', snapshots => {
          let tmpArr = [];
          snapshots.forEach(snapshot => {            
            if (students && students.length != 0) {
              students.map(item => {
                if (item.id == snapshot.val().student_id) {
                  tmpArr.push({
                    ...item,
                    rtdbid: item.key,
                    checkin: snapshot.val().present,
                  });
                }
              });
            }
          });

          if (tmpArr.length != 0) {
            setUpdated(Date.now());
            setStudents(tmpArr);
          }
        });

      // Stop listening for updates when no longer required
      return () => database().ref('/students').off('value', seatsChange);
    }
  }, [studentsReady]);

  React.useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', e => {
      BackHandler.exitApp();
      return true;
    });
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  React.useEffect(() => {
    if (busesList) {
      firestore()
        .collection('students')
        //.where('bus_id', '==', busId)
        .get()
        .then(docs => {
          let tmpStudents = [];

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
                icon: doc.data().gender == 'male' ? '👨' : '👩',
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
          });

          setStudents(tmpStudents);
          setStudentsList(tmpStudents);
          setStudentsReady(true);
          setLoading(false);
          if (busesList && busesList.length != 0) {
            handleChangeBus(busesList[0].name);
          }
        })
        .catch(err => {
          setLoading(false);
        });
    }
  }, [busesList]);

  React.useEffect(() => {
    const watchID = setInterval(() => {
      if (busId) {
        firestore()
          .collection('students')
          .where('bus_id', '==', busId)
          .get()
          .then(docs => {
            let tmpBusesData = null;

            docs.forEach(doc => {
              if (doc.data().position) {
                tmpBusesData = {
                  id: doc.id,
                  position: doc.data().position,
                  icon: '🚌',
                };
              }
            });
            setBusData(tmpBusesData);
          })
          .catch(err => {
            //console.log(err);
          });
      }
    }, 10000);

    return () => {
      clearInterval(watchID);
    };
  }, [busId]);

  React.useEffect(() => {
    if (students && busData && busId) {
      students.map(item => {
        loadRoutes(busData, item.position, item.id);
      });
    }
  }, [students, busId, busData]);

  function handleChangeBus(bus_id) {
    setBusId(bus_id);
    setShow(false);

    if (studentsList) {
      const filtereStudents = [];
      studentsList.map(item => {
        if (item.bus_id == bus_id) {
          filtereStudents.push(item);
        }
      });
      setUpdated(Date.now());

      setStudents(filtereStudents);
    }
  }

  function loadRoutes(bus, position, student) {
    if (bus && position && student) {
      const {lng, lat} = position;
      fetch(
        `http://router.project-osrm.org/route/v1/driving/${bus.position.lng},${bus.position.lat};${lng},${lat}?overview=full&geometries=geojson`,
      )
        .then(res => res.json())
        .then(response => {
          if (
            response.routes &&
            response.routes[0] &&
            response.routes[0].geometry &&
            response.routes[0].geometry.coordinates
          ) {
            const routeTimeEstmiated = parseInt(
              response.routes[0].duration / 60,
            );
            let tmpTime = timeEstimated;
            tmpTime[student] = String(routeTimeEstmiated);

            setTimeEstimated(tmpTime);
          }
        })
        .catch(error => {
          console.log(error);
        });
    }
  }

  return (
    <ScrollView style={{height: '100%', backgroundColor: '#7f0000'}}>
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
                  key={'bus-' + item.id}
                  onPress={() => handleChangeBus(item.name)}>
                  <Text style={{color: '#000', fontWeight: 'bold'}}>
                    {index + 1} -{' '}
                  </Text>
                  <Text
                    style={{
                      color: '#000',
                      fontWeight: 'bold',
                    }}>
                    Bus - {item.name}
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

        <Text style={{color: '#fefcc0', fontSize: 18, fontWeight: 'bold'}}>
          Supervisor Dashboard
        </Text>
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

      <View
        style={{
          flex: 1,
          justifyContent: 'space-between',
          flexDirection: 'row',
        }}>
        <TouchableOpacity style={{padding: 15}} onPress={() => setShow(true)}>
          <Text
            style={{color: '#fff', margin: 5, fontSize: 26, color: '#fefcc0'}}>
            Buses List <Icon name="caret-down" size={26} color="#fefcc0" />
          </Text>
        </TouchableOpacity>
        <Text
          style={{
            color: '#fff',
            margin: 15,
            fontSize: 18,
            color: '#fefcc0',
            textAlign: 'center',
            padding: 15,
          }}>
          Bus ID: {busId}
        </Text>
      </View>

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
        students.map((item, index) => (
          <View
            key={item.id}
            style={{flexDirection: 'row', alignItems: 'center'}}>
            <View
              key={item.id}
              style={{
                padding: 5,
                flex: 1,
                flexDirection: 'row',
                backgroundColor: '#fefcc0',
                borderRadius: 15,
                margin: 15,
                flexDirection: 'row',
              }}>
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
                  Board Time: {item.boarding_time}
                </Text>
                <Text style={{color: '#7f0000', margin: 5, fontSize: 16}}>
                  Get Off Time: {item.get_off_time}
                </Text>
                <Text style={{color: '#7f0000', margin: 5, fontSize: 16}}>
                  Bus No.: {item.bus_id}
                </Text>
                {timeEstimated && timeEstimated[item.id] && (
                  <Text style={{color: '#7f0000', margin: 5, fontSize: 16}}>
                    Estimated Arrival Time: {timeEstimated[item.id]} Minutes
                  </Text>
                )}
              </View>
            </View>

            {item.checkin && (
              <Icon name="check" size={26} color="lime" margin={4} />
            )}
          </View>
        ))}

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

      {busData && students && (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            height: 500,
            margin: 15,
            borderRadius: 25,
            overflow: 'hidden',
          }}>
          <LeafletView
            mapMarkers={busData && [...students, busData]}
            mapCenterPosition={busData.position}
            //mapShapes={DEFAULT_SHAPES}
            doDebug={false}
            zoom={14}
            //zoomControl={false}
          />
        </View>
      )}
    </ScrollView>
  );
}
