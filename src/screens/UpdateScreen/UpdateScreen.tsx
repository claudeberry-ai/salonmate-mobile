import { View, Text, Image, TouchableOpacity, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Config from '~/constants/backend';

export default function UpdateAvailableScreen() {
  const adminEmail = Config.adminEmail;
  const handleContactAdmin = () => {
    Linking.openURL(`mailto:${adminEmail}?subject=Salonmate - Request Updated Version`);
  };
  return (
    <View className="bg-lightgray-100 flex-1 items-center justify-center p-6">
      <StatusBar style="dark" />

      {/* Logo at the top */}
      <Image
        style={{ height: 120, width: 500 }}
        source={require('../../../assets/logo1.png')}
        className="mb-8"
        resizeMode="contain"
      />

      {/* Update Available Title */}
      <Text className="text-gold mb-6 text-3xl font-bold">Update Available!</Text>

      {/* Update Benefits Card */}
      <View className="mb-8 w-full rounded-xl bg-white p-6 shadow-md">
        <Text className="mb-4 text-lg font-semibold text-gray-800">
          What's new in this version:
        </Text>

        <View className="space-y-3">
          <View className="flex-row items-start">
            <Text className="text-gold mr-2 font-bold">•</Text>
            <Text className="flex-1 text-gray-700">New features to enhance your experience</Text>
          </View>
          <View className="flex-row items-start">
            <Text className="text-gold mr-2 font-bold">•</Text>
            <Text className="flex-1 text-gray-700">Improved performance and speed</Text>
          </View>
          <View className="flex-row items-start">
            <Text className="text-gold mr-2 font-bold">•</Text>
            <Text className="flex-1 text-gray-700">Critical security updates</Text>
          </View>
          <View className="flex-row items-start">
            <Text className="text-gold mr-2 font-bold">•</Text>
            <Text className="flex-1 text-gray-700">Bug fixes for smoother operation</Text>
          </View>
        </View>
      </View>

      {/* Update Button */}
      <TouchableOpacity
        onPress={handleContactAdmin}
        className="bg-gold w-full items-center rounded-full px-8 py-4 shadow-lg"
        activeOpacity={0.8}>
        <Text className="text-lg font-bold text-white">Contact Admin</Text>
      </TouchableOpacity>
    </View>
  );
}
