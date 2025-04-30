import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface TermsModalProps {
  visible: boolean;
  onClose: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ visible, onClose }) => {
  return (
    <Modal visible={visible} transparent animationType="slide">
      {/* Dark background overlay */}
      <View className="flex-1 items-center justify-center bg-black/50">
        {/* Modal container with adjusted height */}
        <View className="h-4/5 w-4/5 rounded-lg bg-white p-6">
          {/* Header with Title & Close Icon */}
          <View className="mb-5 flex-row items-center justify-between">
            <View>
              <Text className="text-xl font-bold text-gray-800">Terms & Policies</Text>
              <View className="mt-2 h-1 w-28 rounded-full bg-yellow-500" />
            </View>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="gray" />
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView className="h-3/5">
            <Text className="mb-2 text-gray-700">
              By using this application, you agree to the following terms and conditions.
            </Text>
            <Text className="mt-2 font-semibold text-gray-800">1. App Stability</Text>
            <Text className="text-gray-700">
              This app is under continuous development. Bugs and unexpected behavior may occur.
            </Text>
            <Text className="mt-2 font-semibold text-gray-800">2. Downtime</Text>
            <Text className="text-gray-700">
              We do not guarantee 100% uptime. Maintenance, updates, or technical issues may cause
              temporary service disruptions.
            </Text>
            <Text className="mt-2 font-semibold text-gray-800">3. Payment Responsibility</Text>
            <Text className="text-gray-700">
              We are not responsible for any payment failures, incorrect transactions, or disputes.
            </Text>
            <Text className="mt-2 font-semibold text-gray-800">4. Data Security</Text>
            <Text className="text-gray-700">
              While we take precautions to protect user data, we cannot guarantee complete security.
            </Text>
            <Text className="mt-2 font-semibold text-gray-800">5. Data Usage</Text>
            <Text className="text-gray-700">
              We may collect and use anonymized usage data to improve app performance and user
              experience. This may include but is not limited to: feature usage statistics, crash
              reports, and performance metrics.
            </Text>

            <Text className="mt-2 font-semibold text-gray-800">6. Changes to Terms</Text>
            <Text className="text-gray-700">
              We may modify these terms at any time. Continued use of the app indicates acceptance.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default TermsModal;
