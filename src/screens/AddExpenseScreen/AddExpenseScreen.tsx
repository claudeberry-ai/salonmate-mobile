import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '~/constants/backend';
import { uploadWithImg } from '~/api/api';

type ExpenseType = 0 | 1 | 2; // 0: Purchase, 1: Staff Salary, 2: Other
type AttachmentType = {
  uri: string;
  name?: string;
  mimeType?: string;
} | null;

type user = {
  userId: number;
  salonId: number;
  userName: string;
  userType: number; // Add usertype to the user type
  reportAccess: number;
  serviceStaff: number;
};

const AddExpenseScreen = () => {
  const [user, setUser] = useState<user | null>(null);
  const [expenseType, setExpenseType] = useState<ExpenseType>(0);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [attachment, setAttachment] = useState<AttachmentType>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [expenseDate, setExpenseDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

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

  const handleSubmit = async () => {
    if (!user) return;
    if (!amount || isNaN(parseFloat(amount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      formData.append('user', user.userId.toString());
      formData.append('salon', user.salonId.toString());
      formData.append('type', expenseType.toString());
      formData.append('amount', parseFloat(amount).toString() || '');
      formData.append('description', description || '');
      formData.append('date', expenseDate.toISOString());

      if (attachment) {
        formData.append('attachment', {
          uri: attachment.uri,
          name: attachment.name || `file_${Date.now()}`,
          type: attachment.mimeType || 'application/octet-stream',
        } as any);
      }

      const url = 'api/expense/addExpense';

      // Replace with your API call function
      const response = await uploadWithImg(url, formData);
      if (response.success == true) {
        setIsSubmitting(false);
        Alert.alert('Success', 'Expense added successfully!');
        setExpenseType(0);
        setAmount('');
        setDescription('');
        setAttachment(null);
      } else {
        setIsSubmitting(false);
        Alert.alert('Error', 'An error Occurred!');
      }
    } catch (err) {
      console.log(err);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setAttachment({
          uri: file.uri,
          name: file.name,
          mimeType: file.mimeType,
        });
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        // aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        setAttachment({
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          mimeType: asset.type === 'image' ? 'image/jpeg' : 'video/mp4',
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        // aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        setAttachment({
          uri: asset.uri,
          name: `photo_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
        });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setExpenseDate(selectedDate);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-6 py-4">
        <Text className="text-2xl font-bold text-indigo-600">Add New Expense</Text>
      </View>

      <ScrollView className="flex-1 p-6" contentContainerStyle={{ paddingBottom: 50 }}>
        {/* Expense Type Picker */}
        <View className="mb-6">
          <Text className="mb-2 font-medium text-gray-700">Expense Type</Text>
          <View className="overflow-hidden rounded-lg border border-gray-300 bg-white">
            <Picker
              selectedValue={expenseType}
              onValueChange={(itemValue: ExpenseType) => setExpenseType(itemValue)}
              style={{ color: '#4f46e5' }}
              dropdownIconColor="#4f46e5">
              <Picker.Item label="Purchase" value={0} />
              <Picker.Item label="Staff Salary" value={1} />
              <Picker.Item label="Other" value={2} />
            </Picker>
          </View>
        </View>

        {/* Amount Input */}
        <View className="mb-6">
          <Text className="mb-2 font-medium text-gray-700">Amount</Text>
          <View className="flex-row items-center rounded-lg border border-gray-300 bg-white px-4">
            <Text className="mr-2 text-gray-500">₹</Text>
            <TextInput
              className="flex-1 py-3 text-gray-700"
              placeholder="Enter amount"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>
        </View>
        <View className="mb-6">
          <Text className="mb-2 font-medium text-gray-700">Expense Date</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            className="rounded-lg border border-gray-300 bg-white p-4">
            <Text className="text-gray-700">{expenseDate.toDateString()}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={expenseDate}
              mode="date"
              display="default"
              onChange={onChangeDate}
              maximumDate={new Date()}
            />
          )}
        </View>

        {/* Description Input */}
        <View className="mb-6">
          <Text className="mb-2 font-medium text-gray-700">Description</Text>
          <TextInput
            className="h-32 rounded-lg border border-gray-300 bg-white p-4 text-gray-700"
            placeholder="Enter description (optional)"
            multiline
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Attachment Section */}
        <View className="mb-8">
          <Text className="mb-2 font-medium text-gray-700">Attachment (Optional)</Text>

          {attachment ? (
            <View className="mb-4 flex-row items-center justify-between rounded-lg bg-indigo-50 p-4">
              <View className="flex-row items-center">
                <MaterialIcons
                  name={attachment.mimeType?.includes('pdf') ? 'picture-as-pdf' : 'image'}
                  size={24}
                  color="#4f46e5"
                />
                <Text className="ml-2 text-indigo-700" numberOfLines={1}>
                  {attachment.name || 'Attachment'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setAttachment(null)}>
                <Feather name="x" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row justify-between">
              <TouchableOpacity
                className="mr-2 flex-1 items-center rounded-lg border border-indigo-500 bg-white p-4"
                onPress={pickDocument}>
                <MaterialIcons name="attach-file" size={24} color="#4f46e5" />
                <Text className="mt-2 text-indigo-600">Upload PDF/File</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="ml-2 flex-1 items-center rounded-lg border border-indigo-500 bg-white p-4"
                onPress={pickImage}>
                <MaterialIcons name="image" size={24} color="#4f46e5" />
                <Text className="mt-2 text-indigo-600">Choose Image</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="ml-2 flex-1 items-center rounded-lg border border-indigo-500 bg-white p-4"
                onPress={takePhoto}>
                <MaterialIcons name="camera-alt" size={24} color="#4f46e5" />
                <Text className="mt-2 text-indigo-600">Take Photo</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          className={`rounded-lg py-4 ${isSubmitting ? 'bg-indigo-400' : 'bg-indigo-600'} items-center shadow-md`}
          onPress={handleSubmit}
          disabled={isSubmitting}>
          <Text className="text-lg font-bold text-white">
            {isSubmitting ? 'Submitting...' : 'Submit Expense'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default AddExpenseScreen;
