import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { MaterialIcons, FontAwesome6 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native'; // ✅ Import useNavigation
import { RootStackParamList } from '../../navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import TermsModal from '~/components/Modals/TermsAndConditionsModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '~/constants/backend';

type user = {
  userId: number;
  salonId: number;
  userType: number;
};

const SettingsScreen = () => {
  const [user, setUser] = useState<user | null>(null);
  const adminEmail = Config.adminEmail;

  const handleContactAdmin = () => {
    Linking.openURL(`mailto:${adminEmail}?subject=Salonmate - Support`);
  };

  useEffect(() => {
    const getUser = async () => {
      const user = await AsyncStorage.getItem(Config.AsyncUserKey);
      if (user) {
        const parsedUser = JSON.parse(user);
        setUser(parsedUser);
      }
    };
    getUser();
  }, []);

  return (
    <ScrollView className="flex-1 bg-gray-100">
      {/* Title Section */}
      <View className="mb-6 mt-6 items-center py-6">
        <Text className="text-2xl font-bold tracking-wider">Settings</Text>
        <View className="mt-2 h-1 w-24 rounded-full bg-orange-300" />
      </View>

      {/* Settings Options */}
      <View className="px-5">
        <SettingButton icon="edit" title="Edit Profile" pack="MaterialIcons" nav="EditProfile" />
        <SettingButton
          icon="lock"
          title="Change Password"
          pack="MaterialIcons"
          nav="ChangePassword"
        />

        {user?.userType == 0 && (
          <>
            <SettingButton
              icon="shop"
              title="Salon Management"
              pack="FontAwesome6"
              nav="SalonManagement"
            />
            <SettingButton
              icon="users"
              title="Staff Management"
              pack="FontAwesome6"
              nav="StaffManagement"
            />
          </>
        )}

        <SettingButton
          icon="headset-mic"
          title="Contact Support"
          pack="MaterialIcons"
          onPress={handleContactAdmin}
        />
        <SettingButton
          icon="description"
          title="Terms & Policies"
          pack="MaterialIcons"
          nav="Home"
        />
        <SettingButton icon="logout" title="Logout" isLogout pack="MaterialIcons" nav="Home" />
      </View>
    </ScrollView>
  );
};

// Reusable Button Component
const SettingButton = ({
  icon,
  title,
  pack,
  nav,
  isLogout = false,
  onPress,
}: {
  icon: string;
  title: string;
  pack: string;
  nav?: keyof RootStackParamList | '';
  isLogout?: boolean;
  onPress?: () => void;
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>(); // ✅ Get navigation object
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleNavigation = () => {
    if (onPress) {
      onPress();
    } else if (title == 'Terms & Policies') {
      setIsModalVisible(true);
    } else if (isLogout) {
      // Show Confirmation Alert
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
                await AsyncStorage.removeItem(Config.AsyncUserKey);
                await AsyncStorage.removeItem(Config.logoAsyncKey);
                navigation.replace('Login'); // Navigate to login screen
              } catch (error) {
                console.error('Error clearing AsyncStorage:', error);
              }
            },
          },
        ],
        { cancelable: false }
      );
    } else if (nav) {
      navigation.navigate(nav as never);
    }
  };

  return (
    <>
      <TouchableOpacity
        className="mb-4 rounded-lg bg-white p-5 shadow-sm"
        activeOpacity={0.7}
        onPress={handleNavigation}>
        <View className="flex-row items-center">
          {pack === 'MaterialIcons' ? (
            <MaterialIcons name={icon as any} size={28} color={isLogout ? '#FF4444' : '#FFA500'} />
          ) : (
            <FontAwesome6 name={icon as any} size={22} color={isLogout ? '#FF4444' : '#FFA500'} />
          )}
          <Text className="ml-4 flex-1 text-lg text-gray-700">{title}</Text>
          <MaterialIcons name="chevron-right" size={24} color="#888" />
        </View>
      </TouchableOpacity>
      <TermsModal visible={isModalVisible} onClose={() => setIsModalVisible(false)} />
    </>
  );
};

export default SettingsScreen;
