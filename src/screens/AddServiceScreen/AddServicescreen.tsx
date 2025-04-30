import  { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';

import { RootStackParamList } from '../../navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '~/constants/backend';
import { postReq } from '~/api/api';
import LoadingIndicator from '~/components/Loading/LoadingIndicator';

type Props = NativeStackScreenProps<RootStackParamList, 'AddService'>;

type user = {
  userId: number;
  salonId: number;
};

export default function AddServiceScreen({ navigation }: Props) {
  const [user, setUser] = useState<user | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [rate, setRate] = useState('');
  const [expectedTime, setExpectedTime] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'Men' | 'Women' | 'Kids'>('Men');

  const [errors, setErrors] = useState({
    serviceName: '',
    rate: '',
    expectedTime: '',
    description: '',
  });

  const [isLoading, setIsLoading] = useState(false);

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

  // Validation function
  const validateForm = () => {
    let valid = true;
    let newErrors = { serviceName: '', rate: '', expectedTime: '', description: '' };

    if (!serviceName.trim()) {
      newErrors.serviceName = 'Service Name is required';
      valid = false;
    } else if (serviceName.length > 50) {
      newErrors.serviceName = 'Service Name cannot exceed 50 characters';
      valid = false;
    }

    if (!rate.trim()) {
      newErrors.rate = 'Rate is required';
      valid = false;
    } else if (isNaN(Number(rate)) || Number(rate) <= 0) {
      newErrors.rate = 'Enter a valid numeric rate';
      valid = false;
    }

    if (!expectedTime.trim()) {
      newErrors.expectedTime = 'Expected Time is required';
      valid = false;
    } else if (isNaN(Number(expectedTime)) || Number(expectedTime) <= 0) {
      newErrors.expectedTime = 'Enter a valid numeric time';
      valid = false;
    }

    if (description.length > 100) {
      newErrors.description = 'Description cannot exceed 100 characters';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  // Handle form submission
  const handleAddService = async () => {
    if (validateForm()) {
      if (!user?.salonId) {
        return;
      }

      setIsLoading(true);
      try {
        const service = {
          salonId: user?.salonId,
          serviceName: serviceName.trim(),
          serviceRate: rate,
          serviceTime: expectedTime,
          serviceDesc: description.trim(),
          serviceCat: category == 'Men' ? 0 : category == 'Women' ? '1' : 2,
        };

        const url = 'api/services/create';

        const response = await postReq(url, service);
        if (response.success == true) {
          Alert.alert('Success', 'Service added successfully');
        } else {
          Alert.alert('Error', 'An error occurred ! Try again later.');
        }
        navigation.replace('Services');
      } catch (err) {
        console.log(err);
      } finally {
        setIsLoading(false);
      }
    }
  };
  if (isLoading) return <LoadingIndicator color="blue" />;
  return (
    <ScrollView className="flex-1 bg-gray-100 p-6">
      {/* Title */}
      <Text className="mb-4 text-2xl font-bold text-blue-600">Add New Service</Text>

      {/* Service Name */}
      <Text className="my-2 text-lg font-semibold text-gray-700">Service Name</Text>
      <TextInput
        value={serviceName}
        onChangeText={setServiceName}
        className="mb-1 rounded-lg border border-gray-300 bg-white p-3 text-lg"
        placeholder="Enter service name"
      />
      {errors.serviceName ? (
        <Text className="mb-3 text-sm text-red-500">{errors.serviceName}</Text>
      ) : null}

      {/* Rate */}
      <Text className="my-2 text-lg font-semibold text-gray-700">Rate (₹)</Text>
      <TextInput
        value={rate}
        onChangeText={setRate}
        keyboardType="numeric"
        className="mb-1 rounded-lg border border-gray-300 bg-white p-3 text-lg"
        placeholder="Enter rate"
      />
      {errors.rate ? <Text className="mb-3 text-sm text-red-500">{errors.rate}</Text> : null}

      {/* Expected Time */}
      <Text className="my-2 text-lg font-semibold text-gray-700">Expected Time (mins)</Text>
      <TextInput
        value={expectedTime}
        onChangeText={setExpectedTime}
        keyboardType="numeric"
        className="mb-1 rounded-lg border border-gray-300 bg-white p-3 text-lg"
        placeholder="Enter expected time"
      />
      {errors.expectedTime ? (
        <Text className="mb-3 text-sm text-red-500">{errors.expectedTime}</Text>
      ) : null}

      {/* Description (Optional) */}
      <Text className="my-2 text-lg font-semibold text-gray-700">
        Description (Max 100 Characters)
      </Text>
      <TextInput
        value={description}
        onChangeText={(text) => {
          if (text.length <= 100) setDescription(text);
        }}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        className="mb-1 rounded-lg border border-gray-300 bg-white p-3 text-lg"
        placeholder="Enter description (optional)"
        style={{
          height: 120, // Explicit height
          borderWidth: errors.description ? 2 : 1,
          borderColor: errors.description ? 'red' : '#D1D5DB',
          backgroundColor: 'white',
          padding: 10,
          fontSize: 16,
          borderRadius: 8,
        }}
      />
      {errors.description ? (
        <Text className="mb-3 text-sm text-red-500">{errors.description}</Text>
      ) : null}

      {/* Category Picker */}
      <Text className="my-2 text-lg font-semibold text-gray-700">Category</Text>
      <View className="mb-5 flex-row justify-between rounded-lg border border-gray-300 bg-white p-3">
        {['Men', 'Women', 'Kids'].map((item) => (
          <TouchableOpacity
            key={item}
            className={`mx-1 flex-1 items-center rounded-lg py-2 ${
              category === item ? 'bg-blue-500' : 'bg-gray-200'
            }`}
            onPress={() => setCategory(item as 'Men' | 'Women' | 'Kids')}>
            <Text
              className={`text-lg font-semibold ${category === item ? 'text-white' : 'text-gray-600'}`}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Buttons */}
      <View className="mt-5 flex-row justify-between">
        <TouchableOpacity
          className="mr-2 flex-1 items-center rounded-lg bg-gray-600 py-3"
          onPress={() => navigation.goBack()}>
          <Text className="text-lg font-semibold text-white">Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="ml-2 flex-1 items-center rounded-lg bg-blue-600 py-3"
          onPress={handleAddService}>
          <Text className="text-lg font-semibold text-white">Add Service</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
