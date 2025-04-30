import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';
import { uploadWithImg } from '~/api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '~/constants/backend';

import { RootStackParamList } from '../../navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateSalon'>;

interface SalonFormData {
  name: string;
  building: string;
  city: string;
  contact: string;
  email: string;
}

type userData = {
  userId: number;
  userEmail: string;
};

const CreateSalonPage = ({ navigation }: Props) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SalonFormData>();
  const [logo, setLogo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [userData, setUserData] = useState<userData | null>(null);

  const pickLogo = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets[0].uri) {
      setLogo(result.assets[0].uri);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const user = await getUserData();
      setUserData(user);
    };

    fetchUserData();
  }, []);

  const getUserData = async () => {
    const user = await AsyncStorage.getItem(Config.AsyncUserKey);
    if (user) return JSON.parse(user);
    else return null;
  };

  const onSubmit = async (data: SalonFormData) => {
    if (!userData) {
      return;
    }
    setIsLoading(true);
    try {
      const formData = new FormData();

      // Append text fields
      formData.append('userId', userData?.userId.toString());
      formData.append('userEmail', userData?.userEmail.toString());
      formData.append('salonName', data.name);
      formData.append('salonAddr', data.building);
      formData.append('salonCity', data.city);
      formData.append('salonContact', data.contact);
      formData.append('salonEmail', data.email);

      // Append logo if available
      if (logo) {
        formData.append('logo', {
          uri: logo,
          type: 'image/jpeg', // Adjust the type based on the image format
          name: 'logo.jpg', // Adjust the name as needed
        } as any);
      }

      // Replace with your API endpoint
      const url = 'api/salons/create';

      // Replace with your API call function
      const response = await uploadWithImg(url, formData);


      const userD = response.user;

      const userDetails = {
        userId: userD.userId,
        userName: userD.userName,
        userContact: userD.userContact,
        userEmail: userD.userEmail,
        userType: userD.userType,
        salonId: userD.salonId,
        salonName: userD.salonName,
        salonAddr: userD.salonAddr,
        salonCity: userD.salonCity,
        salonContact: userD.salonContact,
        salonEmail: userD.salonEmail,
        subLevel: userD.subLevel,
      };


      await AsyncStorage.setItem(Config.AsyncUserKey, JSON.stringify(userDetails));

      if (response.success == true) {
        Alert.alert('Success', 'Salon created successfully!');
        navigation.replace('Home');
      } else {
        Alert.alert('Error', 'Failed to create salon');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'An error occurred while creating the salon');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="mt-10 flex-1">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        className="bg-lightgray flex-1 p-6">
        {/* Page Title */}
        <Text className="text-gold mb-8 text-3xl font-bold">Create Salon</Text>

        {/* Logo Upload Section */}
        <View className="mb-8 items-center">
          <TouchableOpacity onPress={pickLogo}>
            <View
              style={{ width: 150, height: 150 }}
              className="border-gold items-center justify-center rounded-full border-2 bg-gray-200">
              {logo ? (
                <Image source={{ uri: logo }} className="h-full w-full rounded-full" />
              ) : (
                <Text className="text-center text-gray-500">Upload Logo</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View className="space-y-6">
          {/* Name Input */}
          <View>
            <Text className="mb-2 font-medium text-gray-700">Salon Name</Text>
            <Controller
              control={control}
              rules={{ required: 'Name is required' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="Enter salon name"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  className="rounded-lg border border-gray-300 bg-white p-4"
                />
              )}
              name="name"
            />
            {errors.name && <Text className="mt-2 text-red-500">{errors.name.message}</Text>}
          </View>

          {/* Building Input */}
          <View>
            <Text className="mb-2 font-medium text-gray-700">Building</Text>
            <Controller
              control={control}
              rules={{ required: 'Building is required' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="Enter building name"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  className="rounded-lg border border-gray-300 bg-white p-4"
                />
              )}
              name="building"
            />
            {errors.building && (
              <Text className="mt-2 text-red-500">{errors.building.message}</Text>
            )}
          </View>

          {/* City Input */}
          <View>
            <Text className="mb-2 font-medium text-gray-700">City</Text>
            <Controller
              control={control}
              rules={{ required: 'City is required' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="Enter city"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  className="rounded-lg border border-gray-300 bg-white p-4"
                />
              )}
              name="city"
            />
            {errors.city && <Text className="mt-2 text-red-500">{errors.city.message}</Text>}
          </View>

          {/* Contact Input */}
          <View>
            <Text className="mb-2 font-medium text-gray-700">Contact</Text>
            <Controller
              control={control}
              rules={{ required: 'Contact is required' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="Enter contact number"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="number-pad"
                  className="rounded-lg border border-gray-300 bg-white p-4"
                />
              )}
              name="contact"
            />
            {errors.contact && <Text className="mt-2 text-red-500">{errors.contact.message}</Text>}
          </View>

          {/* Email Input */}
          <View>
            <Text className="mb-2 font-medium text-gray-700">Email</Text>
            <Controller
              control={control}
              rules={{
                required: 'Email is required',
                pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="Enter email"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  keyboardType='email-address'
                  className="rounded-lg border border-gray-300 bg-white p-4"
                />
              )}
              name="email"
            />
            {errors.email && <Text className="mt-2 text-red-500">{errors.email.message}</Text>}
          </View>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
          className="bg-gold mt-8 items-center rounded-lg p-4">
          <Text className="text-lg font-bold text-white">
            {isLoading ? 'Creating...' : 'Create Salon'}
          </Text>
        </TouchableOpacity>

        {/* Extra Spacing for Keyboard */}
        <View className="h-20" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CreateSalonPage;
