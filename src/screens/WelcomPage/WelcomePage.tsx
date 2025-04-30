
import { View, Text, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';

import { RootStackParamList } from '../../navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Scissors } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '~/constants/backend';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

const WelcomePage = ({ navigation }: Props) => {
  const logOut = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(Config.AsyncUserKey); // Clear stored user data
              navigation.replace('Login'); // Navigate to login screen
            } catch (error) {
              console.error('Error clearing AsyncStorage:', error);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <ScrollView className="mt-10 flex-1 bg-gray-100 p-5">
      {/* Welcome Message */}
      <View className="mt-10 items-center">
        <Text className="text-3xl font-bold tracking-widest text-black">Welcome!</Text>
        <View className="mt-2 h-1 w-28 rounded-full bg-yellow-500" />
        <Text className="mt-4 text-center text-lg text-gray-800">
          Thank you for joining us. Let's get started with managing your salon efficiently.
        </Text>
      </View>

      {/* Highlight Box */}
      <View className="mx-5 mt-20 rounded-lg border border-yellow-500 bg-white p-5 shadow-sm">
        <View className="flex-row items-center justify-center">
          {/* <Text className="mb-4 mr-3 text-xl font-bold text-black">Why Use</Text> */}
          <Image
            style={{ height: 50, width: 150, resizeMode: 'contain' }}
            source={require('../../../assets/logo-text.png')} // Replace with your image URL
            //   className="h-32 w-32 rounded-full border-4 border-orange-300"
          />
        </View>
        <View className="space-y-3">
          <View className="mb-4 flex-row items-center justify-center">
            <Scissors size={25} color="#1e40af" />
            <Text className="ml-2 flex-1 text-gray-800">
              Streamline appointments and reduce no-shows with automated reminders.
            </Text>
          </View>
          <View className="mb-4 flex-row items-start">
            <Scissors size={25} color="#1e40af" />
            <Text className="ml-2 flex-1 text-gray-800">
              Manage staff schedules and track their performance effortlessly.
            </Text>
          </View>
          <View className="mb-4 flex-row items-start">
            <Scissors size={25} color="#1e40af" />
            <Text className="ml-2 flex-1 text-gray-800">
              Keep track of inventory and avoid running out of essential supplies.
            </Text>
          </View>
          <View className="mb-4 flex-row items-start">
            <Scissors size={25} color="#1e40af" />
            <Text className="ml-2 flex-1 text-gray-800">
              Provide a seamless experience for your clients with online booking.
            </Text>
          </View>
          <View className="mb-4 flex-row items-start">
            <Scissors size={25} color="#1e40af" />
            <Text className="ml-2 flex-1 text-gray-800">
              Generate detailed reports to analyze your salon's performance.
            </Text>
          </View>
        </View>
      </View>

      {/* Create New Salon Button */}
      <View className="mx-5 mt-16 items-center">
        <TouchableOpacity
          className="w-full flex-row items-center justify-center rounded-lg bg-yellow-500 p-4"
          onPress={() => navigation.navigate('CreateSalon')} // Navigate to the Create Salon screen
        >
          <Text className="text-lg font-semibold text-black">Create New Salon</Text>
        </TouchableOpacity>

        <TouchableOpacity className="mt-5">
          <Text className="text-lg tracking-wider text-gray-500">Join a Salon now !</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={logOut} className="mt-5">
          <Text className="text-lg font-semibold tracking-wider text-red-500">Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default WelcomePage;
