import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Dimensions, TouchableOpacity, Image } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { getReq } from '~/api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '~/constants/backend';

type MonthlyData = {
  month: string;
  services: number;
  earnings: number;
  monthNum: string;
};

type Staff = {
  userId: number;
  userName: string;
  signedUrl: string;
  userType: number;
  serviceStaff: number;
  reportAccess: number;
  appAccess:number;
};

type StaffModifyRouteParams = {
  userId: number;
};
type user = {
  userId: number;
  salonId: number;
  userName: string;
  userType: number; // Add usertype to the user type
};

type Props = NativeStackScreenProps<RootStackParamList, 'StaffPerformance'>;

const UserPerformanceScreen = ({ route, navigation }: Props) => {
  const { userId } = route.params as StaffModifyRouteParams;
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [totalServices, setTotalServices] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);

  const [staffData, setStaffData] = useState<Staff>();
  const [user, setUser] = useState<user | null>(null);

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
    const getUserMonthly = async () => {
      if (!userId) return;

      const url1 = `api/users/getUserInfo/${userId}`;

      const response1 = await getReq(url1);
      setStaffData(response1.user);

      const url = `api/users/getUserPerformance/${userId}`;
      const response = await getReq(url);

      if (response.success) {
        // Convert string earnings to numbers and sort by monthNum
        const processedData = response.data
          .map((item: any) => ({
            ...item,
            earnings: Number(item.earnings),
            services: Number(item.services),
          }))
          .sort((a: MonthlyData, b: MonthlyData) => a.monthNum.localeCompare(b.monthNum));

        setMonthlyData(processedData);

        // Calculate totals
        const servicesTotal = processedData.reduce(
          (sum: number, item: MonthlyData) => sum + item.services,
          0
        );
        const earningsTotal = processedData.reduce(
          (sum: number, item: MonthlyData) => sum + item.earnings,
          0
        );

        setTotalServices(servicesTotal);
        setTotalEarnings(earningsTotal);
      }
    };
    getUserMonthly();
  }, [userId]);

  // Chart configuration with orange/gray theme
  const chartConfig = {
    backgroundColor: '#f3f4f6', // light gray
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`, // gray-500
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    barPercentage: 0.6,
    propsForLabels: {
      fontSize: 10,
    },
    fillShadowGradient: '#f97316', // orange-500
    fillShadowGradientOpacity: 1,
    propsForBackgroundLines: {
      strokeWidth: 0.5,
      stroke: '#d1d5db', // gray-300
    },
  };

  const screenWidth = Dimensions.get('window').width - 40;

  return (
    <View className="mt-5 bg-gray-100 p-5">
      {/* Header with edit button */}
      <View className="mb-6 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => {
              if (staffData && user?.userType==0) navigation.navigate('StaffModify', { staff: staffData });
            }}>
            {staffData?.signedUrl && (
              <Image
                style={{ width: 80, height: 80 }}
                source={{ uri: staffData?.signedUrl }}
                className="rounded-full border-2 border-orange-300"
              />
            )}
          </TouchableOpacity>
          <View className="ml-3 flex-col">
            <Text className=" text-3xl font-bold text-gray-800">{staffData?.userName}</Text>
            <View className="mt-2 h-1 w-28 rounded-full bg-orange-300" />
          </View>
        </View>
      </View>

      {/* Summary Cards */}
      <View className="mb-8 mt-7 flex-col justify-between">
        <Text>Last 5 Months Performance:</Text>
        <View className="mt-2 flex-row justify-between">
          <View className="w-[48%] rounded-xl bg-white p-5 shadow-sm">
            <Text className="mb-1 text-sm text-gray-500">Total Services</Text>
            <Text className="text-3xl font-bold text-orange-500">{totalServices}</Text>
          </View>
          <View className="w-[48%] rounded-xl bg-white p-5 shadow-sm">
            <Text className="mb-1 text-sm text-gray-500">Total Earnings</Text>
            <Text className="text-3xl font-bold text-gray-700">
              ₹{totalEarnings.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Bar Chart */}
      <View className="mt-6 rounded-xl bg-white p-5 shadow-sm">
        <Text className="mb-4 text-lg font-semibold text-gray-800">Monthly Performance</Text>
        {monthlyData.length > 0 ? (
          <>
            <BarChart
              data={{
                labels: monthlyData.map((item) => item.month),
                datasets: [
                  {
                    data: monthlyData.map((item) => item.earnings),
                  },
                ],
              }}
              width={screenWidth / 1.1}
              height={220}
              yAxisLabel="₹"
              yAxisSuffix=""
              chartConfig={chartConfig}
              verticalLabelRotation={0}
              fromZero
              showBarTops={true}
              showValuesOnTopOfBars={true}
              withInnerLines={false}
              style={{
                borderRadius: 12,
                paddingRight: 50,
              }}
            />
            <View className="mt-4 flex-row justify-center space-x-6">
              <View className="flex-row items-center">
                <View className="mr-2 h-3 w-3 rounded-full bg-orange-400" />
                <Text className="text-md text-orange-500">Earnings</Text>
              </View>
            </View>
          </>
        ) : (
          <Text className="py-10 text-center text-gray-500">Loading performance data...</Text>
        )}
      </View>
    </View>
  );
};

export default UserPerformanceScreen;
