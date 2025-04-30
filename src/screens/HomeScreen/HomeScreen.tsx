import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Image,
  TouchableWithoutFeedback,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import {
  Home,
  Scissors,
  FileText,
  Settings,
  PlusCircle,
  Bell,
  User,
  TrendingUp,
  Calendar,
  Star,
  IndianRupeeIcon,
  Banknote,
  Wallet,
  ArrowDownCircle,
  ReceiptText,
  TrendingDown,
} from 'lucide-react-native';

import { RootStackParamList } from '../../navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '~/constants/backend';
import { getReq, postReq } from '~/api/api';
import { FontAwesome } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

type user = {
  userId: number;
  salonId: number;
  userName: string;
  userType: number; // Add usertype to the user type
  reportAccess: number;
  serviceStaff: number;
  salonLogoPath: string;
};
type staff = {
  userId: number;
  userName: string;
  profilePicSigned: string;
};

type DailyData = {
  sales: { amount: string; services: string }[]; // specify shape
  expense: { expense: string }[];
};

export default function HomeScreen({ navigation }: Props) {
  const [user, setUser] = useState<user | null>(null);
  const [staffList, setStaffList] = useState<staff[] | null>(null);

  const [dailyData, setDailyData] = useState<DailyData>();
  const [showExpenseMenu, setShowExpenseMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Tile Buttons Data
  const tiles = [
    {
      id: 1,
      title: 'New',
      icon: <PlusCircle size={30} color="white" />,
      color: 'bg-purple-400',
      // Remove the static screen property since we'll handle it dynamically
      handlePress: (userType: number | undefined, navigation: any) => {
        if (userType === 2) {
          navigation.navigate('NewSale'); // Or whatever screen you want for other user types
        } else {
          navigation.navigate('CurrentSale');
        }
      },
    },
    {
      id: 2,
      title: 'Services',
      icon: <Scissors size={30} color="white" />,
      color: 'bg-blue-500',
      screen: 'Services',
    },
    {
      id: 3,
      title: 'Reports',
      icon: <FileText size={30} color="white" />,
      color: 'bg-green-700',
      screen: 'Reports',
    },
    {
      id: 4,
      title: 'Settings',
      icon: <Settings size={30} color="white" />,
      color: 'bg-orange-400',
      screen: 'Settings',
    },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Re-fetch all your data
      await getUser();
      await getStaffs();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    getUser();
  }, []);

  const getUser = async () => {
    const user = await AsyncStorage.getItem(Config.AsyncUserKey);
    if (user) {
      const parsedUser = JSON.parse(user);
      setUser(parsedUser);
    }
    
  };
  useEffect(() => {
    getStaffs();
  }, [user]);
  const getStaffs = async () => {
    if (!user) return;
    const url = `api/salons/getAllServiceUsers/${user?.salonId}`;
    const staffs = await getReq(url);

    setStaffList(staffs);

    const url2 = `api/sale/getSaleAndServiceSummary`;

    const data = {
      userId: user?.userId,
      salonId: user?.salonId,
      userType: user?.userType,
      reportAccess: user?.reportAccess,
    };
    const response = await postReq(url2, data);

    if (response.success) {
      setDailyData(response.data);
    }
  };

  const filteredTiles =
    user?.userType === 0 || user?.reportAccess === 1
      ? tiles // Show all tiles for usertype 0 and 1
      : tiles.filter((tile) => tile.title !== 'Services' && tile.title !== 'Reports'); // Hide "Services" and "Reports" for other usertypes

  // Calculate the height of the FlatList based on the number of tiles
  const tileHeight = 130; // Height of each tile
  const numColumns = 2; // Number of columns
  const numRows = Math.ceil(filteredTiles.length / numColumns); // Number of rows needed
  const flatListHeight = numRows * tileHeight; // Total height of the FlatList

  const ExpenseMenu = ({ onClose, navigation }: { onClose: () => void; navigation: any }) => {
    return (
      <View className="right absolute bottom-10 w-48 rounded-lg bg-purple-300 p-1 shadow-lg">
        <TouchableOpacity
          className="flex-row items-center p-3"
          onPress={() => {
            navigation.navigate('AddExpense');
            onClose();
          }}>
          <PlusCircle size={20} color="#6200ea" className="mr-2" />
          <Text className="ml-2 text-gray-800">New Expense</Text>
        </TouchableOpacity>
        <View className="h-px bg-gray-200" />
        <TouchableOpacity
          className="flex-row items-center p-3"
          onPress={() => {
            navigation.navigate('ExpenseGallery');
            onClose();
          }}>
          <FileText size={20} color="#6200ea" className="mr-2" />
          <Text className="ml-2 text-gray-800">Expense Gallery</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6200ea']} // Purple color to match your theme
            tintColor="#6200ea"
          />
        }>
        <TouchableWithoutFeedback
          onPress={() => {
            setShowExpenseMenu(false);
          }}>
          <View className="flex-1 bg-gray-100 p-5">
            {/* Greeting Section */}
            <View style={{ flex: 4 }}>
              <View className="mb-3">
                <Text className="font-poppins text-2xl font-bold text-gray-800">
                  Welcome, {user?.userName}
                </Text>
                <Text className="text-gray-500">Today is {new Date().toDateString()}</Text>
              </View>

              {/* Tiles Section */}
              <View style={{ height: flatListHeight }}>
                <FlatList
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                  data={filteredTiles} // Use filteredTiles instead of tiles
                  numColumns={2}
                  keyExtractor={(item) => item.id.toString()}
                  columnWrapperStyle={{ justifyContent: 'space-between' }}
                  // / Set the height dynamically
                  contentContainerStyle={{ paddingBottom: 16 }} // Add padding to avoid overlap
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        if (item.handlePress) {
                          item.handlePress(user?.userType, navigation);
                        } else if (item.screen) {
                          navigation.navigate(item.screen as any);
                        }
                      }}
                      className={`h-32 w-[48%] ${item.color} mb-4 items-center justify-center rounded-xl`}>
                      {item.icon}
                      <Text className="mt-1 text-lg font-semibold text-white">{item.title}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>

              {user?.userType == 2 && user.reportAccess == 0 && (
                <View
                  style={{ flex: 1 }}
                  className="my-3 items-center justify-center rounded-xl bg-white p-4">
                  <Text className="mb-3 text-lg font-semibold">Upcoming Appointments</Text>
                  {/* <Text>No appointments found</Text> */}
                  <Text className="text-gray-500">Feature coming soon !</Text>
                </View>
              )}

              {/* Staff List - Horizontal Scroll */}
              <View className="mt-2">
                {(user?.userType == 0 || user?.reportAccess == 1) && (
                  <>
                    <Text className="mb-2 text-lg font-bold text-gray-800">Our Staff</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      className="flex-row">
                      {Array.isArray(staffList) &&
                        staffList.slice(0, 4).map((staff, index) => (
                          <TouchableOpacity
                            onPress={() => {
                              if (user.userType == 0 || user.reportAccess == 1)
                                navigation.navigate('StaffPerformance', { userId: staff.userId });
                            }}
                            key={staff.userId || index}
                            className="mx-3 items-center"
                            style={{ width: 60 }}>
                            <Image
                              style={{ width: 60, height: 60 }}
                              source={{ uri: staff.profilePicSigned }}
                              className="rounded-full border border-gray-300"
                            />
                            <Text
                              className="mt-1 text-sm font-semibold text-gray-700"
                              numberOfLines={2}
                              ellipsizeMode="tail"
                              style={{ textAlign: 'center' }}>
                              {staff.userName}
                            </Text>
                          </TouchableOpacity>
                        ))}

                      {user.userType == 0 && staffList && staffList.length > 4 && (
                        <TouchableOpacity
                          className="mx-3 items-center justify-center"
                          style={{ width: 60 }}
                          onPress={() => navigation.navigate('StaffManagement')}>
                          <FontAwesome name="arrow-right" size={24} color="purple" />
                          <Text className="mt-1 text-sm font-semibold text-gray-700">View All</Text>
                        </TouchableOpacity>
                      )}
                    </ScrollView>
                  </>
                )}
              </View>

              {user?.reportAccess == 0 && user.serviceStaff == 1 && user.userType != 0 && (
                <TouchableOpacity
                  onPress={() => {
                    if (user?.userId)
                      navigation.navigate('StaffPerformance', { userId: user.userId });
                  }}
                  className="flex-row items-center justify-center rounded-xl bg-blue-400 py-5">
                  <Star size={20} color="white" />
                  <Text className="ml-3 text-xl font-semibold tracking-wider text-white">
                    My Performance
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Stats / Summary Section */}
            <View className="mb-10 mt-10 rounded-xl bg-white p-5 shadow-md" style={{ flex: 1 }}>
              <Text className="text-lg font-bold text-gray-800">Todays Stats</Text>
              <View className="mt-3 flex-row justify-between px-4">
                <View className="items-center">
                  <TrendingUp size={25} color="#FFD700" />
                  <Text className="text-lg font-semibold text-gray-700">
                    ₹{dailyData?.sales?.[0]?.amount ?? '-'}
                  </Text>
                  <Text className="text-sm text-gray-500">Revenue</Text>
                </View>
                {(user?.userType == 0 || user?.reportAccess == 1) && (
                  <View className="items-center">
                    <TrendingDown size={25} color="red" />
                    <Text className="text-lg font-semibold text-gray-700">
                      ₹{dailyData?.expense?.[0]?.expense ?? '-'}
                    </Text>
                    <Text className="text-sm text-gray-500">Expense</Text>
                  </View>
                )}
                <View className="items-center">
                  <Scissors size={25} color="#1e40af" />
                  <Text className="text-lg font-semibold text-gray-700">
                    ₹{dailyData?.sales?.[0]?.services ?? '-'}
                  </Text>
                  <Text className="text-sm text-gray-500">Services </Text>
                </View>
              </View>
            </View>

            {/* Bottom Quick Action Bar */}
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
      <View className="absolute bottom-0 left-0 right-0 flex-row items-center justify-around bg-white p-2 shadow-lg">
        <TouchableOpacity className="items-center justify-center">
          <Home size={22} color="#6200ea" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            if (user?.reportAccess == 1 || user?.userType == 0)
              setShowExpenseMenu(!showExpenseMenu);
          }}
          className="items-center justify-center">
          <IndianRupeeIcon size={22} color={showExpenseMenu ? '#6200ea' : 'gray'} />
          {showExpenseMenu && (
            <ExpenseMenu onClose={() => setShowExpenseMenu(false)} navigation={navigation} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          className="items-center justify-center"
          // onPress={() => navigation.navigate('AppointmentSchedule')}
        >
          <Calendar size={22} color="gray" />
        </TouchableOpacity>
        <TouchableOpacity
          className="items-center justify-center"
          onPress={() => navigation.navigate('EditProfile')}>
          <User size={22} color="gray" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
