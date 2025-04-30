import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '~/constants/backend';
import { putReq } from '~/api/api';

type Props = NativeStackScreenProps<RootStackParamList, 'ChangePassword'>;

type user = {
  userId: number;
  salonId: number;
  userName: string;
  userType: number;
};

const ChangePasswordScreen = ({ navigation }: Props) => {
  const [user, setUser] = useState<user | null>(null);

  const [existingPassword, setExistingPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // State for toggling password visibility
  const [showExistingPassword, setShowExistingPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

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

  // Validate password requirements
  const validatePassword = (password: string): boolean => {
    const hasMinimumLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    return hasMinimumLength && hasNumber;
  };

  // Handle form submission
  const handleUpdate = async () => {
    if (!user) return;
    const newErrors: { [key: string]: string } = {};

    // Validate existing password
    if (!existingPassword) {
      newErrors.existingPassword = 'Existing password is required.';
    }

    // Validate new password
    if (!newPassword) {
      newErrors.newPassword = 'New password is required.';
    } else if (!validatePassword(newPassword)) {
      newErrors.newPassword =
        'Password must be at least 8 characters long and contain at least 1 number.';
    }

    // Validate confirm password
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password.';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    // Set errors or proceed
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    } else {
      setErrors({});
      const data = {
        userId: user?.userId,
        userPass: existingPassword,
        newPass: newPassword,
      };

      const url = 'api/users/updatePass';
      const response = await putReq(url, data);

      if (response.success) {
        Alert.alert('Success', 'Password Updated Successfully!');
        navigation.navigate('Settings');
      } else {
        Alert.alert('Error', 'Existing Password is Incorrect!');
      }
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-100 p-5">
      <View className="mt-5 py-5">
        <Text className="text-2xl font-semibold">Change Password</Text>
      </View>

      {/* Existing Password Input */}
      <View className="mb-6 mt-5">
        <Text className="mb-2 font-semibold text-gray-700">Existing Password</Text>
        <View className="flex-row items-center rounded-lg border border-gray-200 bg-white p-4">
          <TextInput
            className="flex-1"
            placeholder="Enter your existing password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry={!showExistingPassword}
            value={existingPassword}
            onChangeText={setExistingPassword}
          />
          <TouchableOpacity onPress={() => setShowExistingPassword(!showExistingPassword)}>
            <MaterialIcons
              name={showExistingPassword ? 'visibility-off' : 'visibility'}
              size={24}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        </View>
        {errors.existingPassword && (
          <Text className="mt-1 text-sm text-red-500">{errors.existingPassword}</Text>
        )}
      </View>

      {/* New Password Input */}
      <View className="mb-6">
        <Text className="mb-2 font-semibold text-gray-700">New Password</Text>
        <View className="flex-row items-center rounded-lg border border-gray-200 bg-white p-4">
          <TextInput
            className="flex-1"
            placeholder="Enter your new password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry={!showNewPassword}
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
            <MaterialIcons
              name={showNewPassword ? 'visibility-off' : 'visibility'}
              size={24}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        </View>
        {errors.newPassword && (
          <Text className="mt-1 text-sm text-red-500">{errors.newPassword}</Text>
        )}
      </View>

      {/* Confirm New Password Input */}
      <View className="mb-8">
        <Text className="mb-2 font-semibold text-gray-700">Confirm New Password</Text>
        <View className="flex-row items-center rounded-lg border border-gray-200 bg-white p-4">
          <TextInput
            className="flex-1"
            placeholder="Confirm your new password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            <MaterialIcons
              name={showConfirmPassword ? 'visibility-off' : 'visibility'}
              size={24}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        </View>
        {errors.confirmPassword && (
          <Text className="mt-1 text-sm text-red-500">{errors.confirmPassword}</Text>
        )}
      </View>

      {/* Password Requirements */}
      <Text className="mt-5 text-sm text-gray-500">
        1. Password must be at least 8 characters long.
      </Text>
      <Text className="mt-2 text-sm text-gray-500">
        2. Password must contain at least 1 number.
      </Text>

      {/* Update Button */}
      <TouchableOpacity
        className="mt-8 items-center rounded-lg bg-orange-500 p-4"
        onPress={handleUpdate}>
        <Text className="text-lg font-semibold text-white">Update Password</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ChangePasswordScreen;
