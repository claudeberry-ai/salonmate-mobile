import { Scissors } from 'lucide-react-native';
import { View, Text, Image, TouchableOpacity, Linking } from 'react-native';
import Config from '~/constants/backend';

const SubscriptionEndedScreen = () => {
  // Replace with your app's logo path
  const appLogo = require('../../../assets/logo-text.png');

  // Replace with your admin contact email
  const adminEmail = Config.adminEmail;

  const handleContactAdmin = () => {
    Linking.openURL(`mailto:${adminEmail}?subject=Salonmate - Subscription Extension Request`);
  };

  return (
    <View className="bg-lightgray flex-1 items-center justify-center p-6">
      {/* App Logo */}
      <Image
        source={appLogo}
        style={{ width: 200, height: 70 }}
        className="mb-8"
        resizeMode="contain"
      />

      {/* Title */}
      <Text className="text-gold mb-4 text-3xl font-bold">Subscription Ended</Text>

      {/* Message */}
      <Text className="mb-8 text-center text-lg text-gray-700">
        Your subscription has ended. Continue using the app to enjoy exclusive benefits.
      </Text>

      {/* Benefits Section */}
      <View className=" mb-8 ml-5 mr-5 rounded-lg bg-white p-4 shadow-sm">
        <Text className="text-gold mb-4 text-xl font-bold">Why Continue?</Text>
        <View className="space-y-3">
          <View className="mb-3 flex-row items-start space-x-3">
            <Scissors size={20} color="orange" />
            <Text className="ml-3 text-gray-700">
              Streamline appointments and reduce no-shows with automated reminders.
            </Text>
          </View>
          <View className="mb-3 flex-row items-start space-x-3">
            <Scissors size={20} color="orange" />
            <Text className="ml-3 text-gray-700">
              Manage staff schedules and track their performance effortlessly.
            </Text>
          </View>
          <View className="mb-3 flex-row items-start space-x-3">
            <Scissors size={20} color="orange" />
            <Text className="ml-3 text-gray-700">
              Provide a seamless experience for your clients with online booking.
            </Text>
          </View>
          <View className="mb-3 flex-row items-start space-x-3">
            <Scissors size={20} color="orange" />
            <Text className="ml-3 text-gray-700">
              Generate detailed reports to analyze your salon's performance.
            </Text>
          </View>
        </View>
      </View>

      {/* Contact Admin Button */}
      <TouchableOpacity
        onPress={handleContactAdmin}
        className="bg-gold items-center rounded-lg p-4">
        <Text className="text-lg font-bold text-white">Contact Admin to Extend Subscription</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SubscriptionEndedScreen;
