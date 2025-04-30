import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '~/constants/backend';
import { getReq } from '~/api/api';

type Props = NativeStackScreenProps<RootStackParamList, 'StaffManagement'>;

type User = {
  userId: number;
  salonId: number;
  userName: string;
  userType: number;
};

type Staff = {
  userId: number;
  userName: string;
  profilePicSigned: string;
  userType: number;
  serviceStaff: number;
};

const StaffManagementScreen = ({ navigation }: Props) => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [sortedStaffList, setSortedStaffList] = useState<Staff[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const getUserTypeText = (type: number) => {
    switch (type) {
      case 0:
        return 'Owner';
      case 1:
        return 'Admin';
      case 2:
        return 'Staff';
      case 3:
        return 'Other';
      default:
        return 'Unknown';
    }
  };

  const getUserTypeColor = (type: number) => {
    switch (type) {
      case 0:
        return 'bg-green-600';
      case 1:
        return 'bg-purple-500';
      case 2:
        return 'bg-blue-500';
      case 3:
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  // Sort staff by type (Owner → Admin → Staff → Other) and then alphabetically
  const sortStaff = (staff: Staff[]) => {
    return staff.sort((a, b) => {
      // First sort by userType
      if (a.userType !== b.userType) {
        return a.userType - b.userType;
      }
      // Then sort alphabetically by userName
      return a.userName.localeCompare(b.userName);
    });
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

  useEffect(() => {
    const getStaffs = async () => {
      if (!user?.salonId) return;

      try {
        setLoading(true);
        const url = `api/salons/getAllUsers/${user.salonId}`;
        const staffs = await getReq(url);

        const formattedStaffs = staffs.map((staff: any) => ({
          userId: staff.userId,
          userName: staff.userName,
          profilePicSigned: staff.profilePicSigned || '',
          userType: staff.userType ?? -1,
          serviceStaff: staff.serviceStaff ?? 0,
        }));

        setStaffList(formattedStaffs);
        setSortedStaffList(sortStaff(formattedStaffs));
      } catch (error) {
        console.error('Error fetching staff:', error);
        Alert.alert('Error', 'Failed to fetch staff data');
      } finally {
        setLoading(false);
      }
    };

    getStaffs();
  }, [user]);

  const handleRowPress = (staff: Staff) => {
    // Handle row press
    
    navigation.navigate('StaffPerformance', { userId : staff.userId  });
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100">
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-100 p-4">
      {/* Title Section */}
      <View className="mb-6 items-center">
        <Text className="text-2xl font-bold tracking-wider text-gray-800">Staff Management</Text>
        <View className="mt-2 h-1 w-24 rounded-full bg-orange-300" />
      </View>

      {/* Table Header */}
      <View className="flex-row rounded-t-lg bg-gray-200 p-3">
        <View className="w-1/4 items-center">
          <Text className="font-bold text-lg text-orange-500">Profile</Text>
        </View>
        <View className="w-2/4 items-center">
          <Text className="font-bold text-lg text-orange-500">Name</Text>
        </View>
        <View className="w-1/4 items-center">
          <Text className="font-bold text-lg text-orange-500">Role</Text>
        </View>
      </View>

      {/* Staff List */}
      {sortedStaffList.length > 0 ? (
        <FlatList
          data={sortedStaffList}
          keyExtractor={(item) => item.userId.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="flex-row items-center border-b border-gray-200 bg-white p-3"
              onPress={() => handleRowPress(item)}>
              {/* Profile Picture */}
              <View className="w-1/4 items-center">
                <Image
                  source={{ uri: item.profilePicSigned }}
                  className="h-12 w-12 rounded-full border-2 border-gray-300"
                  defaultSource={{ uri: '' }}
                />
              </View>

              {/* Name */}
              <View className="w-2/4">
                <Text className="ml-4 text-left font-medium text-gray-700">{item.userName}</Text>
              </View>

              {/* Role */}
              <View className="w-1/4 items-center">
                <Text
                  className={`rounded-full px-3 py-1 text-xs text-white ${getUserTypeColor(item.userType)}`}>
                  {getUserTypeText(item.userType)}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <View className="flex-1 items-center justify-center rounded-b-lg bg-white p-6">
          <Text className="text-lg text-gray-500">No staff members found</Text>
        </View>
      )}

      {/* Add Staff Button */}
      <TouchableOpacity
        className="mt-6 items-center rounded-lg bg-orange-400 p-3 shadow-lg active:bg-orange-600"
        onPress={() => {
          navigation.navigate('CreateStaffProfile');
        }}>
        <Text className="text-lg font-bold text-white">+ Add Staff</Text>
      </TouchableOpacity>
    </View>
  );
};

export default StaffManagementScreen;
