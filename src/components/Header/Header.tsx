import { View, Image, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '~/constants/colors';
import { CommonActions, useNavigation,useRoute } from '@react-navigation/native'; // Import useNavigation
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

export default function Header() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();

  const navigateToHome = () => {
    if (route.name !== 'Home') { // Navigate only if not already on Home
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        })
      );
    }
  };


  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <TouchableOpacity onPress={navigateToHome}>
            <Image
              source={require('../../../assets/logo-text.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#000', // Ensures safe area matches header color
  },
  container: {
    height: 60,
    backgroundColor: COLORS.statusbar, // Black background
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  logo: {
    width: 120,
    height: 80,
    marginRight: 10,
    tintColor: '#FFD700', // Gold color
  },
  brandName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700', // Gold text
  },
});
