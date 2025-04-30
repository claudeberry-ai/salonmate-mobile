import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { Calendar, ChevronDown, TrendingUp } from 'lucide-react-native';

import { RootStackParamList } from '../../navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '~/constants/backend';
import { getReq } from '~/api/api';
import LoadingIndicator from '~/components/Loading/LoadingIndicator';

type Props = NativeStackScreenProps<RootStackParamList, 'Reports'>;

type user = {
  userId: number;
  salonId: number;
  userName: string;
  userType: number;
};

export default function ReportsScreen({ navigation }: Props) {
  const [selectedTab, setSelectedTab] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [salesData, setSalesData] = useState<{
    Daily: { labels: string[]; datasets: { data: number[] }[] };
    Weekly: { labels: string[]; datasets: { data: number[] }[] };
    Monthly: { labels: string[]; datasets: { data: number[] }[] };
  }>({
    Daily: { labels: [], datasets: [{ data: [] }] },
    Weekly: { labels: [], datasets: [{ data: [] }] },
    Monthly: { labels: [], datasets: [{ data: [] }] },
  });
  const [user, setUser] = useState<user | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentData, setPaymentData] = useState({
    Daily: [] as any[],
    Weekly: [] as any[],
    Monthly: [] as any[],
  });
  const [totalPayments, setTotalPayments] = useState(0);
  const [showReportMenu, setShowReportMenu] = useState(false);

  const screenWidth = Dimensions.get('window').width - 40;

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(34, 100, 94, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    formatYLabel: (label: string) => parseInt(label, 10).toString(),
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
    const fetchSalesData = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        const url = `api/sale/salesReport/${user.salonId}`;
        const response = await getReq(url);

        if (response.success && response.data) {
          setSalesData({
            Daily: response.data.Daily || { labels: [], datasets: [{ data: [] }] },
            Weekly: response.data.Weekly || { labels: [], datasets: [{ data: [] }] },
            Monthly: response.data.Monthly || { labels: [], datasets: [{ data: [] }] },
          });
        }

        const paymentUrl = `api/sale/paymentReport/${user.salonId}`;
        const paymentResponse = await getReq(paymentUrl);

        if (paymentResponse.success && paymentResponse.data) {
          const currentTabData = paymentResponse.data[selectedTab] || [];
          const total = currentTabData.reduce((sum: number, item: any) => sum + item.amount, 0);
          setTotalPayments(total);

          const formattedData = currentTabData.map((item: any) => ({
            name: item.name,
            amount: item.amount,
            percentage: total > 0 ? ((item.amount / total) * 100).toFixed(1) : '0',
            color: item.color,
            legendFontColor: '#000',
            legendFontSize: 12,
          }));

          setPaymentData({
            ...paymentResponse.data,
            [selectedTab]: formattedData,
          });
        }
      } catch (error) {
        console.error('Error fetching sales data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchSalesData();
    }
  }, [user]);

  useEffect(() => {
    const currentTabData = paymentData[selectedTab] || [];
    const total = currentTabData.reduce((sum: number, item: any) => sum + item.amount, 0);
    setTotalPayments(total);
    const formattedData = currentTabData.map((item: any) => ({
      name: item.name,
      amount: item.amount,
      percentage: total > 0 ? ((item.amount / total) * 100).toFixed(1) : '0',
      color: item.color,
      legendFontColor: '#000',
      legendFontSize: 12,
    }));

    setPaymentData({
      ...paymentData,
      [selectedTab]: formattedData,
    });
  }, [selectedTab]);

  if (isLoading) return <LoadingIndicator color="green" text="Loading Report" />;

  return (
    <View className="flex-1 bg-gray-100 p-5">
      <TouchableWithoutFeedback onPress={() => setShowReportMenu(false)}>
        <View className="flex-1">
          {/* Title */}
          <View style={{ flex: 1 }}>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-2xl font-bold text-green-700">Reports</Text>
                <Text className="text-gray-500">Track your earnings </Text>
              </View>

              <View className="">
                <TouchableOpacity
                  onPress={() => setShowReportMenu(!showReportMenu)}
                  className="flex-row items-center rounded-lg bg-green-600 px-2 py-2.5 shadow-sm"
                  activeOpacity={0.8}>
                  <Text className="font-medium text-white">Detailed Report</Text>
                  <ChevronDown size={18} color="white" className="ml-2" />
                </TouchableOpacity>

                {showReportMenu && (
                  <View className="absolute right-0 top-12 z-10 w-48 rounded-lg border border-gray-100 bg-green-100 shadow-lg">
                    <TouchableOpacity
                      className="flex-row items-center border-b border-gray-100 px-4 py-3"
                      onPress={() => {
                        navigation.navigate('DailyReports');
                        setShowReportMenu(false);
                      }}>
                      <TrendingUp size={16} color="#4B5563" className="mr-2" />
                      <Text className="ml-2 text-gray-700">Daily Report</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="flex-row items-center px-4 py-3"
                      onPress={() => {
                        navigation.navigate('MonthlyReports');
                        setShowReportMenu(false);
                      }}>
                      <Calendar size={16} color="#4B5563" className="mr-2" />
                      <Text className="ml-2 text-gray-700">Monthly Report</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* Tabs */}
            <View className="my-2 flex-row items-center justify-around border-b-2 border-b-green-600">
              {['Daily', 'Weekly', 'Monthly'].map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setSelectedTab(tab as 'Daily' | 'Weekly' | 'Monthly')}
                  className={`px-4 py-2`}>
                  <Text
                    className={` ${selectedTab === tab ? 'text-2xl font-bold text-green-600' : 'text-lg text-gray-500'}`}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Bar Chart */}
          <View style={{ flex: 2 }} className="mb-3 rounded-lg bg-white py-3">
            <Text className="mb-3 text-center text-lg font-bold text-gray-800">
              {selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)} Revenue Report
            </Text>

            <View>
              {salesData[selectedTab]?.datasets?.[0]?.data?.length > 0 ? (
                <BarChart
                  data={{
                    labels: salesData[selectedTab].labels,
                    datasets: salesData[selectedTab].datasets,
                  }}
                  width={screenWidth - 10}
                  height={200}
                  yAxisLabel="₹"
                  yAxisSuffix=""
                  chartConfig={chartConfig}
                  withInnerLines={false}
                  withHorizontalLabels={true}
                  showValuesOnTopOfBars={true}
                />
              ) : (
                <Text className="text-center text-gray-500">No data available</Text>
              )}
            </View>
          </View>

          {/* Pie Chart with Improved Legend */}
          <View style={{ flex: 2 }} className="mt-3 rounded-lg bg-white p-4 ">
            <Text className="mb-3 text-center text-lg font-bold text-gray-800">
              {selectedTab === 'Daily'
                ? "Today's"
                : selectedTab === 'Weekly'
                  ? 'Weekly'
                  : 'Monthly'}{' '}
              Payments Breakdown
            </Text>

            {totalPayments != 0 ? (
              <View className="h-[200px] flex-row">
                {/* Pie Chart - Takes 2/3 width */}
                <View style={{ flex: 2 }} className="flex-2 items-center justify-center ">
                  <PieChart
                    data={paymentData[selectedTab]}
                    width={screenWidth} // Reduce width to better center it
                    height={200}
                    chartConfig={chartConfig}
                    accessor="amount"
                    backgroundColor="transparent"
                    hasLegend={false}
                    paddingLeft="0" // Set to 0 to prevent shifting
                    style={{
                      marginLeft: 'auto',
                      marginRight: 'auto', // Forces centering
                    }}
                  />
                </View>

                {/* Custom Legend - Takes 1/3 width */}
                <View style={{ flex: 1 }} className=" flex-1 justify-center pr-4">
                  {paymentData[selectedTab].map((item, index) => (
                    <View key={index} className="mb-2 w-full border-b border-gray-300 pb-2">
                      <View className="flex-row items-center">
                        <View
                          style={{
                            width: 12,
                            height: 12,
                            backgroundColor: item.color,
                            marginRight: 8,
                            borderRadius: 3,
                            justifyContent: 'space-between',
                          }}
                        />
                        <View style={{ flex: 3 }} className="flex-row justify-between">
                          <Text className="mr-2 text-sm font-medium">{item.name}</Text>
                          <Text className="text-md font-bold">₹{item.amount.toLocaleString()}</Text>
                        </View>
                      </View>
                      <View className="ml-5">
                        <Text className="text-right text-sm text-gray-600">
                          ({item.percentage}%)
                        </Text>
                      </View>
                    </View>
                  ))}
                  <View className="mt-0 ">
                    <Text className="text-md text-center font-bold text-green-600">
                      Total: ₹{totalPayments.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <Text className="text-center text-gray-500">No payment data available</Text>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}
