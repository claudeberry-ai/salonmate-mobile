import { StatusBar } from 'expo-status-bar';

import './global.css';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import AppNavigator from '~/navigation/AppNavigator';
import { PrinterProvider } from '~/components/Printer/PrinterContext';
import { View, Text } from 'react-native';
import { useState, useEffect } from 'react';

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        SpaceGrotesk: require('./assets/fonts/SpaceGrotesk-Regular.ttf'),
      });
      setFontsLoaded(true);
    }

    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <View>
        <Text>Loading fonts...</Text>
      </View>
    );
  }
  return (
    <>
      <StatusBar style="auto" />
      <PrinterProvider>
        <AppNavigator />
      </PrinterProvider>
    </>
  );
}
