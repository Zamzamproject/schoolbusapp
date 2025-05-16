import * as React from 'react';
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {LeafletView} from 'react-native-leaflet-view';
import Icon from 'react-native-vector-icons/FontAwesome';
import firestore from '@react-native-firebase/firestore';

export default function MapContainer({route, navigation}) {
  const {bus_id, student_id } = route.params;
  const [data, setData] = React.useState(null);
  const [student, setStudent] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [locations, setLocations] = React.useState([]);
  const [timeEstimated, setTimeEstimated] = React.useState(null);
  const [coordinate, setCoordinate] = React.useState({
    lat: 23.597866,
    lng: 58.4525362,
  });

  React.useEffect(() => {
    if (bus_id) {
      firestore()
        .collection('students')
        .where('bus_id', '==', bus_id)
        .get()
        .then(docs => {
          let tmpStudents = [];
          let tmpStudent = null

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
              });

              if(doc.id == student_id){
                tmpStudent = {
                  id: doc.id,
                  first_name: doc.data().first_name, 
                  last_name: doc.data().last_name,
                  image: 'https://firebasestorage.googleapis.com/v0/b/schoolbustracker-11ddd.appspot.com/o/images%2F' + doc.data().image + '?alt=media',
                  checkin: doc.data().checkin,
                  gender: doc.data().gender,
                  position: doc.data().position,
                  student_id: doc.data().student_id,
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
                }
              }
            }
          });
          
          if(tmpStudent && tmpStudent.position){
            //setCoordinate(tmpStudent.position)
          }
            
          setStudent(tmpStudent);
        })
        .catch(err => {
          //setLoading(false)
        });
    }
  }, [bus_id, coordinate]);

  React.useEffect(() => {
    const watchID = setInterval(() => {
      if(student){
        firestore()
        .collection('buses')
        .doc(bus_id)
        .get()
        .then(doc => {
          setLoading(false);
          console.log(doc.data().position);
          
          let tmpLocations = [
            {
              id: student_id,
              icon: student.gender == 'male' ? '👨' : '👩',
              position: student.position,
            },
            {
              id: bus_id,
              icon: '🚌',
              position: doc.data().position,
            }
          ];

          setLocations(tmpLocations);
          setCoordinate(doc.data().position);
          setData(doc.data());
        })
        .catch(err => {          
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    }, 10000);
    return () => clearInterval(watchID);
  }, [student]);

  React.useEffect(() => {    
    if(data && student){
      loadRoutes()
    }
  }, [data, student]);

  function loadRoutes() {
    if (student && data) {
      console.log(student.position, data.position);
      
      fetch(
        `http://router.project-osrm.org/route/v1/driving/${student.position.lng},${student.position.lat};${data.position.lng},${data.position.lat}?overview=full&geometries=geojson`,
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
            
            setTimeEstimated(String(routeTimeEstmiated));
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
        <TouchableOpacity onPress={() => navigation.navigate('Parents Home')}>
          <Icon name="arrow-left" size={26} color="#fefcc0" />
        </TouchableOpacity>
      </View>
     
     <View style={{padding: 15}}>
        <Text
          style={{color: '#fff', margin: 5, fontSize: 26, color: '#fefcc0'}}>
          Student Location Info{' '}
          <Icon name="caret-down" size={26} color="#fefcc0" />
        </Text>
        <View style={{flexDirection: 'row'}}>
          {student && (
            <Image
              source={{uri: student.image}}
              style={{resizeMode: 'contain', width: 50, height: 50}}
            />
          )}
          <View style={{marginLeft: 0}}>
            <View
              style={{flexDirection: 'row', justifyContent: 'space-between', width: '75%'}}>
              {student && (
                <Text
                  style={{
                    color: '#fff',
                    marginLeft: 15,
                    fontSize: 15,
                    color: '#fefcc0',
                    fontWeight: 'bold',
                  }}>
                  {student.first_name} {student.last_name}
                </Text>
              )}
              {data && (
                <Text
                  style={{
                    color: '#fff',
                    fontSize: 15,
                    color: '#fefcc0',
                    fontWeight: 'bold',
                  }}>
                  <Icon name="bus" size={20} color="#fefcc0" /> {data.name}
                </Text>
              )}
            </View>

            <View
              style={{ padding: 4, margin: 3, width: '95%'}}>
              {student && (
                <Text
                  style={{
                    color: '#fff',
                    margin: 5,
                    fontSize: 12,
                    color: '#fefcc0',
                  }}>
                  Board Time: {student.boarding_time}
                </Text>
              )}
              {student && (
                <Text
                  style={{
                    color: '#fff',
                    margin: 5,
                    fontSize: 12,
                    color: '#fefcc0',
                  }}>
                  Get Off Time: {student.get_off_time}
                </Text>
              )}
              {(student && timeEstimated) && (
                <Text
                  style={{
                    color: '#fff',
                    margin: 5,
                    fontSize: 12,
                    color: '#fefcc0',
                  }}>
                  Estimated time of arrival: {timeEstimated} Minutes
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
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

      {student && student.checkin && <View style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: "#fefcc0", padding: 5, borderRadius: 15, margin: 15, paddingBottom: 50 }}>
        <Image
          source={require('../assets/studenthome.png')}
          style={{
            resizeMode: 'contain',
            width: 50,
            height: 50,
            marginTop: 20,
          }}
          />
        <Text style={{ color: '#fff', margin: 5, fontSize: 26, color: '#7f0000',  textAlign: 'center'}}>Home Sweet home!</Text>
       </View>}
      {student && !student.checkin && <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          height: 400,
          margin: 15,
          borderRadius: 25,
          overflow: 'hidden',
        }}>
        <LeafletView
          mapMarkers={locations}
          mapCenterPosition={coordinate}
          doDebug={false}
          zoom={19}
          //zoomControl={false}
        />
      </View>}
    </ScrollView>
  );
}
