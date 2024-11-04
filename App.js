import { useState, useEffect } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import {
  Appbar,
  Button,
  List,
  PaperProvider,
  Switch,
  Text,
  MD3LightTheme as DefaultTheme,
} from "react-native-paper";
import myColors from "./assets/colors.json";
import myColorsDark from "./assets/colorsDark.json";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { getAllLocations, insertLocation } from "./db";

const DARK_MODE_PREFERENCE_KEY = 'darkModePreference';

export default function App() {
  const [isSwitchOn, setIsSwitchOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [locations, setLocations] = useState(null);

  const [theme, setTheme] = useState({
    ...DefaultTheme,
    myOwnProperty: true,
    colors: myColors.colors,
  });


  async function loadDarkMode() {
    try {
      const value = await AsyncStorage.getItem(DARK_MODE_PREFERENCE_KEY);
      setIsSwitchOn(value == 'true');
    } catch (error) {
      console.log({ error })
    }
  }

  const saveDarkModePreference = async (darkMode) => {
    try {
      await AsyncStorage.setItem(
        DARK_MODE_PREFERENCE_KEY,
        darkMode?.toString(),
      );
    } catch (error) {
      console.log({ error })
    }
  }

  async function onToggleSwitch() {
    setIsSwitchOn(!isSwitchOn);
    saveDarkModePreference(!isSwitchOn)
  }

  async function getLocation() {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Permission to access location was denied');
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    console.log({ location });

    try {
      await insertLocation({
        latitude: location.coords.latitude, 
        longitude: location.coords.longitude
      });

      loadLocations();
    } catch (e) {
      console.error({ erroAoSalvar: e })
    }
  }

  async function loadLocations() {
    console.log('loadLocationss')
    setIsLoading(true);

    const locations = await getAllLocations() // await db.getAllAsync('SELECT * FROM locations')
    console.log({ locations })
    setLocations(locations);
    setIsLoading(false);
  }

  useEffect(() => {
    loadDarkMode();
    loadLocations();
  }, []);

  useEffect(() => {
    if (isSwitchOn) {
      setTheme({ ...theme, colors: myColorsDark.colors });
    } else {
      setTheme({ ...theme, colors: myColors.colors });
    }
  }, [isSwitchOn]);

  return (
    <PaperProvider theme={theme}>
      <Appbar.Header>
        <Appbar.Content title="My Location BASE" />
      </Appbar.Header>
      <View style={{ backgroundColor: theme.colors.background }}>
        <View style={styles.containerDarkMode}>
          <Text>Dark Mode</Text>
          <Switch value={isSwitchOn} onValueChange={onToggleSwitch} />
        </View>
        <Button
          style={styles.containerButton}
          icon="map"
          mode="contained"
          loading={isLoading}
          onPress={() => getLocation()}
        >
          Capturar localização
        </Button>

        <FlatList
          style={styles.containerList}
          data={locations}
          renderItem={({ item }) => (
            <List.Item
              title={`Localização ${item.id}`}
              description={`Latitude: ${item.latitude} | Longitude: ${item.longitude}`}
            ></List.Item>
          )}
        ></FlatList>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  containerDarkMode: {
    margin: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  containerButton: {
    margin: 10,
  },
  containerList: {
    margin: 10,
    height: "100%",
  },
});
