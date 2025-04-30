import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '~/constants/backend';
import { getReq, uploadWithImg } from '~/api/api';
import LoadingIndicator from '~/components/Loading/LoadingIndicator';

import { RootStackParamList } from '../../navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'SalonManagement'>;

type user = {
  userId: number;
  salonId: number;
  userName: string;
  userType: number;
};

type SalonData = {
  salonAddr: string;
  salonCity: string;
  salonContact: string;
  salonEmail: string;
  salonName: string;
  signedUrl: string;
  subLevel: number;
  salonLogo: string;
  // Add other fields if they exist in your API response
};

const SalonManagementScreen = ({ navigation }: Props) => {
  const [salonData, setSalonData] = useState<SalonData | null>(null);
  const [formData, setFormData] = useState({
    salonName: '',
    salonAddr: '',
    salonCity: '',
    salonContact: '',
    salonEmail: '',
    isPrintingEnabled: false,
    isOnlineBookingEnabled: false,
  });
  const [user, setUser] = useState<user | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    const getSalonInfo = async () => {
      try {
        if (!user) return;
        setLoading(true);
        const url = `api/salons/getSalonInfo/${user.salonId}`;
        const response = await getReq(url);

        if (response) {
          setSalonData(response);
          
          // Initialize form data with salon data
          setFormData({
            salonName: response.salonName || '',
            salonAddr: response.salonAddr || '',
            salonCity: response.salonCity || '',
            salonContact: response.salonContact || '',
            salonEmail: response.salonEmail || '',
            isPrintingEnabled: response.defaultPrinting === 1,
            isOnlineBookingEnabled: response.subLevel === 1,
          });
        }
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    getSalonInfo();
  }, [user]);

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!salonData || !user) return;

    try {
      setLoading(true);
      const formData1 = new FormData();

      formData1.append('salonId', user?.salonId.toString());
      formData1.append('salonName', formData.salonName);
      formData1.append('salonAddr', formData.salonAddr);
      formData1.append('salonCity', formData.salonCity);
      formData1.append('salonContact', formData.salonContact);
      formData1.append('salonEmail', formData.salonEmail);
      formData1.append('printing', formData.isPrintingEnabled ? '1' : '0');
      formData1.append('onlineBooking', formData.isOnlineBookingEnabled ? '1' : '0');
      formData1.append('salonLogo', salonData.salonLogo);

      if (logo) {
        formData1.append('logo', {
          uri: logo,
          type: 'image/jpeg',
          name: 'logo.jpg',
        } as any);
      }

      const url = 'api/salons/edit';

      const uploadData = await uploadWithImg(url, formData1);

      if (uploadData.success) {
        const updatedData = {
          ...user,
          salonAddr: formData.salonAddr,
          salonCity: formData.salonCity,
          salonContact: formData.salonContact,
          salonEmail: formData.salonEmail,
          salonName: formData.salonName,
          defaultPrint: formData.isPrintingEnabled,
        };

        await AsyncStorage.setItem(Config.AsyncUserKey, JSON.stringify(updatedData));

        Alert.alert('Success', 'Salon information updated successfully!', [{ text: 'OK' }]);
        navigation.replace('Settings');
      } else {
        Alert.alert('Error', 'Something Went Wrong!', [{ text: 'OK' }]);
        navigation.replace('Settings');
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadProfilePic = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to upload a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setLogo(result.assets[0].uri);
    }
  };

  if (loading) return <LoadingIndicator color="orange" text="Loading Salon Data" />;

  return (
    <ScrollView className="mb-1 flex-1 bg-gray-100 p-6">
      {/* Editable Logo */}
      <View className="mb-6 items-center">
        <TouchableOpacity className="relative" onPress={handleUploadProfilePic}>
          <Image
            style={{
              height: 150,
              width: 150,
              borderRadius: 100,
              borderWidth: 2,
              borderColor: 'orange',
            }}
            source={{
              uri: logo ? logo : salonData?.signedUrl || 'https://via.placeholder.com/100',
            }}
          />
          <View className="absolute bottom-0 right-0 rounded-full bg-white p-1 shadow">
            <MaterialIcons name="edit" size={20} color="#FFA500" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Input Fields */}
      <View className="mb-4 rounded-lg bg-white p-4 shadow">
        <Text className="font-semibold text-gray-700">Salon Name</Text>
        <TextInput
          className="mt-1 rounded-lg border border-gray-300 p-3"
          placeholder="Enter salon name"
          value={formData.salonName}
          onChangeText={(text) => handleInputChange('salonName', text)}
        />
      </View>

      <View className="mb-4 rounded-lg bg-white p-4 shadow">
        <Text className="font-semibold text-gray-700">Building</Text>
        <TextInput
          className="mt-1 rounded-lg border border-gray-300 p-3"
          placeholder="Enter address"
          value={formData.salonAddr}
          onChangeText={(text) => handleInputChange('salonAddr', text)}
        />
      </View>

      <View className="mb-4 rounded-lg bg-white p-4 shadow">
        <Text className="font-semibold text-gray-700">City</Text>
        <TextInput
          className="mt-1 rounded-lg border border-gray-300 p-3"
          placeholder="Enter city"
          value={formData.salonCity}
          onChangeText={(text) => handleInputChange('salonCity', text)}
        />
      </View>

      <View className="mb-4 rounded-lg bg-white p-4 shadow">
        <Text className="font-semibold text-gray-700">Contact</Text>
        <TextInput
          className="mt-1 rounded-lg border border-gray-300 p-3"
          placeholder="+91 0000000000"
          keyboardType="phone-pad"
          value={formData.salonContact}
          onChangeText={(text) => handleInputChange('salonContact', text)}
        />
      </View>

      <View className="mb-4 rounded-lg bg-white p-4 shadow">
        <Text className="font-semibold text-gray-700">Email</Text>
        <TextInput
          className="mt-1 rounded-lg border border-gray-300 p-3"
          placeholder="Enter email"
          keyboardType="email-address"
          value={formData.salonEmail}
          onChangeText={(text) => handleInputChange('salonEmail', text)}
        />
      </View>

      <View className="mb-4 flex-row items-center justify-between rounded-lg bg-white p-4 shadow">
        <Text className="font-semibold text-gray-700">Enable Invoice Printing</Text>
        <Switch
          trackColor={{ false: '#ccc', true: '#FFA500' }}
          thumbColor={formData.isPrintingEnabled ? '#fff' : '#fff'}
          onValueChange={(value) => handleInputChange('isPrintingEnabled', value)}
          value={formData.isPrintingEnabled}
        />
      </View>

      {/* Toggle Switch for Online Booking */}
      {/* <View className="mb-4 flex-row items-center justify-between rounded-lg bg-white p-4 shadow">
        <Text className="font-semibold text-gray-700">Enable Online Bookings</Text>
        <Switch
          trackColor={{ false: '#ccc', true: '#FFA500' }}
          thumbColor={formData.isOnlineBookingEnabled ? '#fff' : '#fff'}
          onValueChange={(value) => handleInputChange('isOnlineBookingEnabled', value)}
          value={formData.isOnlineBookingEnabled}
        />
      </View> */}

      {/* Update Button */}
      <TouchableOpacity
        className="mb-10 mt-6 items-center rounded-lg bg-orange-500 p-4 shadow-lg shadow-orange-400 active:bg-orange-600"
        onPress={handleSubmit}>
        <Text className="text-lg font-bold text-white">Update</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default SalonManagementScreen;
