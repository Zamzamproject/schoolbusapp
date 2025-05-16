import * as React from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Switch,
  BackHandler,
  Image,
} from 'react-native';
import {LeafletView} from 'react-native-leaflet-view';
import Geolocation from '@react-native-community/geolocation';
import Icon from 'react-native-vector-icons/FontAwesome';
import firestore, {serverTimestamp} from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import {useFocusEffect} from '@react-navigation/native';

export default function Driver({navigation}) {
  const today = new Date();

  const [data, setData] = React.useState(null);
  const [students, setStudents] = React.useState(null);
  const [locations, setLocations] = React.useState([]);
  const [coordinate, setCoordinate] = React.useState({
    lat: 23.597866,
    lng: 58.4525362,
  });
  const [isEnabled, setIsEnabled] = React.useState(false);
  const [updated, setUpdated] = React.useState();
  const [bus_id, setBusId] = React.useState(null);

  const handleActive = () => {
    setIsEnabled(previousState => !previousState);
  };
  const [user, setUser] = React.useState(null);
  const [timeEstimated, setTimeEstimated] = React.useState({});

  // Handle user state changes
  const onAuthStateChanged = user => {
    if (user) {
      setUser(user);
      firestore()
        .collection('drivers')
        .doc(user.uid)
        .get()
        .then(doc => {
          setData(doc.data());
          setBusId(doc.data().bus_id);
        })
        .catch(err => {
          //console.log(err);
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

  React.useEffect(() => {
    if (isEnabled) {
      const watchID = Geolocation.watchPosition(
        position => {
          const {latitude, longitude} = position.coords;

          setCoordinate({lat: latitude, lng: longitude});
          let tmpLocations = {
            id: 'Bust 1',
            icon: '🚌',
            position: {lat: latitude, lng: longitude},
          };
          if (students) {
            setLocations([tmpLocations, ...students]);
          } else {
            setLocations([tmpLocations]);
          }
          setLocations([tmpLocations]);

          if (data && position) {
            firestore()
              .collection('buses')
              .doc(data.bus_id)
              .update({
                position: {
                  lat: latitude,
                  lng: longitude,
                },
                last_update: serverTimestamp(),
              })
              .then(res => {
                //console.log('updated');
              })
              .catch(err => {
                //console.log(err);
              });
          }
        },
        error => console.log(error),
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 1000,
          distanceFilter: 10,
        },
      );
      return () => Geolocation.clearWatch(watchID);
    }
  }, [isEnabled, updated]);

  useFocusEffect(
    React.useCallback(() => {
      if (bus_id) {
        firestore()
          .collection('students')
          .where('bus_id', '==', bus_id)
          .get()
          .then(docs => {
            let tmpStudents = [];

            docs.forEach(doc => {
              if (doc.data().position) {
                tmpStudents.push({
                  id: doc.id,
                  position: doc.data().position,
                  icon: '🏠',
                  ...doc.data(),
                });
              }
            });
            
            setStudents(tmpStudents);
          })
          .catch(err => {
            //console.log(err);
          });
      }
    }, [bus_id]),
  );

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
                    rtdbid: snapshot.key,
                    checkin: snapshot.val().present,
                  });
                  if (snapshot.val().present !== item.checkin) {
                    updateStudent(
                      snapshot.val().student_id,
                      snapshot.val().present,
                      snapshot.val().method
                    );
                  }
                } else {
                  //tmpArr.push(item)
                }
              });
            }
          });
          if (tmpArr.length != 0) {
            setStudents(tmpArr);
          }
        });

      // Stop listening for updates when no longer required
      return () => database().ref('/students').off('value', seatsChange);
    }
  }, [students]);

  React.useEffect(() => {
    if(students && coordinate){
      students.map(item => {
        loadRoutes(item.position, item.id)
      })
    }
  }, [coordinate])

  const updateStudent = (student_id, checkin, method) => {
    firestore()
      .collection('students')
      .doc(student_id)
      .get()
      .then(snapshot => {
        snapshot.ref.update({
          boarding_time: checkin ? new Date() : snapshot.data().boarding_time,
          get_off_time: checkin ? snapshot.data().boarding_time : new Date(),
          checkin: checkin,
          last_update: serverTimestamp(),
        })
        .then(() => {
          //
        })
      })
      .finally(res => {
        firestore()
          .collection('students_history')
          .add({
            date: serverTimestamp(),
            student_id: student_id,
            checkin: checkin,
          })
          .then(() => {
            setUpdated(Date.now());
            firestore()
              .collection('students')
              .doc(student_id)
              .get()
              .then(response => {
                firestore()
                  .collection('parents')
                  .doc(response.data().parent_id)
                  .get()
                  .then(pres => {
                    sendNotification(
                      pres.data().token,
                      checkin,
                      pres.data().name,
                      method
                    );
                  })
                  .catch(err => {
                    console.log(err);
                  });

                firestore()
                  .collection('supervisors')
                  .get()
                  .then(supervisors_res => {
                    supervisors_res.forEach(doc => {
                      sendNotification(
                        doc.data().token,
                        checkin,
                        response.data().name,
                        method
                      );
                    });
                  })
                  .catch(err => {
                    console.log(err);
                  });
              })
              .catch(err => {
                console.log(err);
              });
          })
          .catch(err => {
            console.log(err);
          });
      })
      .catch(err => {
        console.log(err);
      });
  };

  const sendNotification = (to_token, checkin, name, method) => {    
    const title = 'Hi ' + name + ', school bus update'
    const message = checkin ? method == 'QR Code' ? 'Successfull' : name + ' is in the school bus.' : name + ' arrived to home!';
    
    if (to_token && to_token != '') {
      fetch('https://sbdnotify.netlify.app/api/notification/', {
        method: 'POST',
        body: JSON.stringify({
          key: 'LWfmn2nV7XKctprbjnahr9SF@R7zqM2TUZAWa.DMxnsUWnUj3t#JgRHrsF9B5QL',
          msg: message,
          title: title,
          token: to_token,
        }),
      })
        .then(() => {
          //
        })
        .catch(err => {
          console.log(err);
        });
    }
  };

  const studentSeatManualUpdate = (student_id, value) => {
    database()
      .ref('/students/' + student_id)
      .update({
        present: value,
        method: "Manual"
      })
      .then(res => {
        //console.log(res);
      })
      .catch(err => {
        console.log(err);
      });
  };

  function loadRoutes(position, student) {
    if (coordinate && position) {
      const {lng, lat} = position;
      fetch(
        `http://router.project-osrm.org/route/v1/driving/${coordinate.lng},${coordinate.lat};${lng},${lat}?overview=full&geometries=geojson`,
      )
        .then(res => res.json())
        .then(response => {
          if (
            response.routes &&
            response.routes[0] &&
            response.routes[0].geometry &&
            response.routes[0].geometry.coordinates
          ) {
            const routeTimeEstmiated = parseInt(response.routes[0].duration / 60);
            let tmpTime = timeEstimated;
            tmpTime[student] = routeTimeEstmiated;
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
          style={{
            color: '#fefcc0',
            margin: 0,
            fontSize: 26,
            fontWeight: 'bold',
          }}>
          Bus Driver Dashboard
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Scan', {bus_id: bus_id})}>
          <Image
            source={require('../assets/qrscan.png')}
            style={{resizeMode: 'contain', width: 26, height: 26}}
          />
        </TouchableOpacity>
      </View>

      <View
        style={{
          padding: 5,
          backgroundColor: '#fefcc0',
          borderRadius: 15,
          margin: 15,
        }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            padding: 15,
          }}>
          <Text
            style={{
              color: '#fff',
              margin: 5,
              fontSize: 18,
              color: '#7f0000',
              fontWeight: 'bold',
            }}>
            <Icon name="user" size={26} color="#7f0000" /> {data && data.first_name} {data && data.last_name}
          </Text>
          <Switch
            trackColor={{false: '#767577', true: '#7f0000'}}
            thumbColor={isEnabled ? '#7f0000' : '#f4f3f4'}
            ios_backgroundColor="#f4f3f4"
            onValueChange={handleActive}
            value={isEnabled}
          />
        </View>

        <View
          style={{
            padding: 5,
            backgroundColor: '#fefcc0',
            borderRadius: 15,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}>
          <Text
            style={{
              color: '#fff',
              margin: 5,
              fontSize: 16,
              color: '#7f0000',
              textAlign: 'center',
            }}>
            <Icon name="bus" size={26} color="#7f0000" /> {data && data.bus_id}
          </Text>
          <Text
            style={{
              color: '#fff',
              margin: 5,
              fontSize: 16,
              color: '#7f0000',
              textAlign: 'center',
            }}>
            <Icon
              name={isEnabled ? 'check' : 'times'}
              size={16}
              color="#7f0000"
            />{' '}
            {isEnabled ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>

      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          padding: 15,
          flexWrap: 'wrap',
        }}>
        {students &&
          students.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={{
                backgroundColor: item.checkin ? 'red' : 'lime',
                //borderRadius: 15,
                //margin: 15,
                borderTopEndRadius: 70,
                borderTopStartRadius: 70,
                borderBottomEndRadius: 40,
                borderBottomStartRadius: 40,
                position: 'relative',
                padding: 0,
                margin: 10,
              }}
              onPress={() => {
                studentSeatManualUpdate(item.rtdbid, !item.checkin);
              }}>
              <Image
                source={{
                  uri:
                    'https://firebasestorage.googleapis.com/v0/b/schoolbustracker-11ddd.appspot.com/o/images%2F' +
                    item.image +
                    '?alt=media',
                }}
                style={{
                  resizeMode: 'contain',
                  width: 130,
                  height: 130,
                  zIndex: 1,
                  alignSelf: 'center',
                  position: 'absolute',
                  padding: 0,
                  margin: 0,
                }}
              />
              <View style={{height: 250, width: 100}}>
                <Text
                  style={{
                    color: '#ffffff',
                    marginTop: '120%',
                    textAlign: 'center',
                  }}>
                  {item.first_name} {item.last_name}
                </Text>
                <Text
                  style={{
                    color: '#ffffff',
                    margin: 5,
                    fontSize: 36,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    //marginTop: '150%',
                  }}>
                  S{index + 1}
                </Text>
                {timeEstimated && timeEstimated[item.id] &&<Text style={{ color: '#000', textAlign: 'center' }}>ETA: { timeEstimated[item.id] } Min</Text>}
              </View>
            </TouchableOpacity>
          ))}
      </View>

      <View style={{flexDirection: 'row', padding: 3}}>
        <View style={{margin: 5, flexDirection: 'row'}}>
          <View
            style={{
              borderRadius: 50,
              backgroundColor: 'lime',
              width: 20,
              height: 20,
              margin: 2,
              marginHorizontal: 15,
            }}></View>
          <Text style={{fontSize: 18, fontWeight: 'bold', color: '#ffffff'}}>
            Empty Seats
          </Text>
        </View>
        <View style={{margin: 5, flexDirection: 'row'}}>
          <View
            style={{
              borderRadius: 50,
              backgroundColor: 'red',
              width: 20,
              height: 20,
              margin: 2,
              marginHorizontal: 15,
            }}></View>
          <Text style={{fontSize: 18, fontWeight: 'bold', color: '#ffffff'}}>
            Full Seats
          </Text>
        </View>
      </View>

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
          mapMarkers={locations}
          mapCenterPosition={coordinate}
          doDebug={false}
          zoom={14}
          //zoomControl={false}
        />
      </View>
    </ScrollView>
  );
}
