import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
// import { updateReq } from '~/api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '~/constants/backend';
import { putReq } from '~/api/api';

type Staff = {
  userId: number;
  userName: string;
  signedUrl: string;
  userType: number;
  serviceStaff: number;
  reportAccess: number;
  appAccess: number;
};

type StaffModifyRouteParams = {
  staff: Staff;
};

type Props = NativeStackScreenProps<RootStackParamList, 'StaffModify'>;

const StaffModifyScreen = ({ route, navigation }: Props) => {
  const { staff } = route.params as StaffModifyRouteParams;

  const [userType, setUserType] = useState(staff.userType);
  const [providesServices, setProvidesServices] = useState(staff.serviceStaff === 1);
  const [reportAccess, setReportAccess] = useState(staff.reportAccess === 1);
  const [appAccess, setAppAccess] = useState(staff.appAccess === 1);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Check if the staff being edited is an owner
  const isOwner = staff.userType === 0;

  useEffect(() => {
    const getCurrentUser = async () => {
      const user = await AsyncStorage.getItem(Config.AsyncUserKey);
      if (user) {
        setCurrentUser(JSON.parse(user));
      }
    };
    getCurrentUser();
  }, []);

  const handleUpdate = async () => {
    if (!currentUser || currentUser.userType !== 0) {
      Alert.alert('Permission Denied', 'Only salon owner can modify staff details');
      return;
    }

    if (userType == -1) {
      Alert.alert('Error', 'Select user type!');
      return;
    }

    setLoading(true);
    try {
      const url = `api/users/updateRole`;
      const updatedData = {
        userId: staff.userId,
        userType: isOwner ? 0 : userType,
        serviceStaff: providesServices ? 1 : 0,
        reportAccess: reportAccess ? 1 : 0,
        appAccess: appAccess ? 1 : 0,
      };

      const response = await putReq(url, updatedData);

      if (response.success) {
        Alert.alert('Success', 'Staff details updated successfully');
        navigation.replace('StaffManagement');
      } else {
        Alert.alert('Error', 'Something went wrong!');
        navigation.replace('StaffManagement');
      }
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'Failed to update staff details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-100 p-6">
      {/* Header */}
      <View className="mb-10 flex-col items-center justify-center">
        <Text className="text-2xl font-bold text-gray-800">Modify Staff</Text>
        <View className="mt-2 h-1 w-24 rounded-full bg-orange-300" />
      </View>

      {/* Staff Info Card */}
      <View className="mb-6 rounded-lg bg-white p-6 shadow">
        <View className="mb-4 items-center">
          <Image
            style={{ width: 150, height: 150 }}
            source={{ uri: staff.signedUrl || '' }}
            className="rounded-full border-2 border-orange-300"
            defaultSource={{ uri: '' }}
          />
        </View>

        <Text className="mb-6 text-center text-2xl font-bold text-gray-800">{staff.userName}</Text>

        {/* User Type Picker - Disabled for owners */}
        <View className="mb-6">
          <Text className="mb-2 font-medium text-gray-700">Staff Role</Text>
          <View
            className={`overflow-hidden rounded-lg border ${isOwner ? 'border-gray-300 bg-gray-100' : 'border-orange-300'}`}>
            <Picker
              selectedValue={userType == -1 ? -1 : userType}
              onValueChange={(itemValue) => {
                setUserType(itemValue); // Actually update the state
              }}
              style={{ color: isOwner ? '#9ca3af' : '#374151' }}
              dropdownIconColor={isOwner ? '#9ca3af' : '#f97316'}
              enabled={!isOwner}>
              <Picker.Item label="Select Type" value={-1} />
              <Picker.Item label="Owner" value={0} />
              <Picker.Item label="Admin" value={1} />
              <Picker.Item label="Staff" value={2} />
            </Picker>
          </View>
          {isOwner && (
            <Text className="mt-1 text-sm text-orange-500">Owner role cannot be changed</Text>
          )}
        </View>

        {/* Services Toggle */}
        <View className="mb-5 flex-row items-center justify-between">
          <Text className="font-medium text-gray-700">Provides Services</Text>
          <Switch
            trackColor={{ false: '#d1d5db', true: '#f97316' }}
            thumbColor="#ffffff"
            value={providesServices}
            onValueChange={setProvidesServices}
            // disabled={isOwner} // Disable switch for owners if needed
          />
        </View>
        <View className="mb-5 flex-row items-center justify-between">
          <Text className="font-medium text-gray-700">Reports Access</Text>
          <Switch
            trackColor={{ false: '#d1d5db', true: '#f97316' }}
            thumbColor="#ffffff"
            value={reportAccess}
            onValueChange={setReportAccess}
            // disabled={isOwner} // Disable switch for owners if needed
          />
        </View>
        <View className="mb-8 flex-row items-center justify-between">
          <Text className="font-medium text-gray-700">App Access</Text>
          <Switch
            trackColor={{ false: '#d1d5db', true: '#f97316' }}
            thumbColor="#ffffff"
            value={appAccess}
            onValueChange={setAppAccess}
            // disabled={isOwner} // Disable switch for owners if needed
          />
        </View>

        {/* Update Button */}
        <TouchableOpacity
          className="items-center rounded-lg bg-orange-500 p-4 shadow-lg"
          onPress={handleUpdate}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-lg font-bold text-white">Update Staff</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default StaffModifyScreen;
