import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  ChevronDown,
  Download,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  BarChart2,
  CalendarIcon,
  Calendar,
  Database,
  ReceiptIcon,
  ReceiptIndianRupee,
  TrendingDown,
} from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { getReq } from '~/api/api';
import * as FileSystem from 'expo-file-system';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '~/constants/backend';
import LoadingIndicator from '~/components/Loading/LoadingIndicator';
import { generateMonthlyReportPDF } from '~/components/PDFGenerator/MonthlySummary';

import ViewShot, { captureRef } from 'react-native-view-shot';
import { generateSalesReportPDF } from '~/components/PDFGenerator/MonthlySale';
import { generateExpenseReportPDF } from '~/components/PDFGenerator/MonthlyExpense';

// Type definitions
type User = {
  userId: number;
  salonId: number;
  userName: string;
  userType: number;
  reportAccess: number;
  serviceStaff: number;
};

type Category = {
  name: string;
  amount: number;
  color: string;
};

type PopularService = {
  name: string;
  count: number;
};
type SalonData = {
  salonName: string;
};
type RevenueData = {
  current: number;
  previous: number;
  trend: number[];
};

type ExpenseData = {
  current: number;
  previous: number;
  categories: Category[];
};

type ServiceData = {
  current: number;
  previous: number;
  popularServices: PopularService[];
};

type CustomerCategory = {
  category: string;
  total: number;
};

type ReportData = {
  salonData: SalonData;
  revenue: RevenueData;
  expense: ExpenseData;
  services: ServiceData;
  customerCategories: CustomerCategory[];
};

type ApiResponse = {
  success: boolean;
  data: {
    salonData: {
      salonName: string;
    };
    revenue: {
      current: string;
      previous: string;
      trend: number[];
    };
    expense: {
      expense: {
        current: string;
        previous: string;
        categories: Array<{
          name: string;
          amount: string;
          color: string;
        }>;
      };
    };
    service: {
      services: {
        current: number;
        previous: number;
        popularServices: PopularService[];
      };
    };
    category: CustomerCategory[];
  };
};

const MonthlyReportScreen = () => {
  const [user, setUser] = useState<User | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [saleData, setSaleData] = useState();
  const [expenseData, setExpenseData] = useState();
  const [loading, setLoading] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const screenWidth = Dimensions.get('window').width - 40;

  const lineChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const [lineChartImage, setLineChartImage] = useState<string | null>(null);
  const [pieChartImage, setPieChartImage] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const user = await AsyncStorage.getItem(Config.AsyncUserKey);
      if (user) {
        const parsedUser = JSON.parse(user) as User;
        setUser(parsedUser);
      }
    };

    getUser();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const url = `api/salons/monthlySummary?salon=${user.salonId}&month=${selectedMonth}&year=${selectedYear}`;
        const response = (await getReq(url)) as ApiResponse;

        if (response.success) {
          const transformedData: ReportData = {
            revenue: {
              current: Number(response.data.revenue.current),
              previous: Number(response.data.revenue.previous),
              trend: response.data.revenue.trend,
            },
            expense: {
              current: Number(response.data.expense.expense.current),
              previous: Number(response.data.expense.expense.previous),
              categories: response.data.expense.expense.categories.map((cat) => ({
                name: cat.name,
                amount: Number(cat.amount),
                color: cat.color,
              })),
            },
            services: {
              current: response.data.service.services.current,
              previous: response.data.service.services.previous,
              popularServices: response.data.service.services.popularServices,
            },
            customerCategories: response.data.category,
            salonData: {
              salonName: response.data.salonData.salonName,
            },
          };
          setReportData(transformedData);
        }

        const url2 = `api/salons/monthlyRevExp?salon=${user.salonId}&month=${selectedMonth}&year=${selectedYear}`;
        const response2 = await getReq(url2);
        if (response2.success == true) {
          setSaleData(response2.data.sale);
          setExpenseData(response2.data.expense);
        }
      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedMonth, selectedYear, user]);

  const calculateChange = (current: number, previous: number) => {
    const amount = current - previous;
    const percentage = previous !== 0 ? (amount / previous) * 100 : 0;
    return {
      amount,
      percentage,
      isPositive: amount >= 0,
    };
  };

  if (loading || !reportData) {
    return <LoadingIndicator color="green" text="Loading Report" />;
  }

  const revenueChange = calculateChange(reportData.revenue.current, reportData.revenue.previous);
  const expenseChange = calculateChange(reportData.expense.current, reportData.expense.previous);
  const servicesChange = calculateChange(reportData.services.current, reportData.services.previous);

  const netCurrent = reportData.revenue.current - reportData.expense.current;
  const netPrevious = reportData.revenue.previous - reportData.expense.previous;
  const netChange = calculateChange(netCurrent, netPrevious);
  const totalCustomers = reportData.customerCategories.reduce(
    (sum, category) => sum + category.total,
    0
  );

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 2 }, (_, i) => currentYear - 1 + i);

  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    decimalPlaces: 0,
    propsForLabels: {
      fontSize: 10,
    },
  };

  const getMonthLabels = () => {
    const labels = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(d.toLocaleString('default', { month: 'short' })); // e.g., Jan, Feb
    }
    return labels;
  };
  const exportSummary = async () => {
    if (reportData && lineChartRef.current && pieChartRef.current) {
      try {
        const LineUri = await captureRef(lineChartRef, {
          format: 'png',
          quality: 1,
        });

        const base64Chart = await FileSystem.readAsStringAsync(LineUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const base64ChartUri = `data:image/png;base64,${base64Chart}`;

        // Save the image URI in state if needed
        setLineChartImage(LineUri);
        const pieUri = await captureRef(pieChartRef, {
          format: 'png',
          quality: 1,
        });

        const base64PieChart = await FileSystem.readAsStringAsync(pieUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const base64PieChartUri = `data:image/png;base64,${base64PieChart}`;

        // Save the image URI in state if needed
        setLineChartImage(pieUri);
        await generateMonthlyReportPDF(
          reportData,
          selectedMonth,
          selectedYear,
          reportData.salonData.salonName,
          base64ChartUri,
          base64PieChartUri
        );
      } catch (err) {
        console.log(err);
      }
    }
  };
  const exportSale = async () => {
    if (saleData) {
      try {
        await generateSalesReportPDF(
          saleData,
          selectedMonth,
          selectedYear,
          reportData.salonData.salonName
        );
      } catch (err) {
        console.log(err);
      }
    }
  };
  const exportExpense = async () => {
    if (expenseData) {
      try {
        await generateExpenseReportPDF(
          expenseData,
          selectedMonth,
          selectedYear,
          reportData.salonData.salonName
        );
      } catch (err) {
        console.log(err);
      }
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* <TouchableWithoutFeedback onPress={() => setShowExportMenu(false)}> */}
        <View>
          {/* Header */}
          <View className="bg-white px-6 py-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-2xl font-bold text-green-700">Monthly Report</Text>
              <TouchableOpacity
                onPress={() => setShowExportMenu(!showExportMenu)}
                className="flex-row items-center rounded-lg bg-green-700 px-3 py-2">
                <Download size={20} color="white" />
                <Text className="ml-2 font-medium text-white">Export</Text>
              </TouchableOpacity>
            </View>
          </View>
          {showExportMenu && (
            <View className="absolute right-5 top-14 z-10 w-48 rounded-lg border border-gray-100 bg-gray-500 shadow-lg">
              <TouchableOpacity
                className="flex-row items-center border-b border-gray-300 px-4 py-3"
                disabled={exporting === 'pdf'} // Disable if exporting is in progress
                onPress={() => {
                  exportSummary(); // Call export function
                  setShowExportMenu(false); // Hide menu after export button press
                }}>
                {exporting === 'pdf' ? (
                  <ActivityIndicator color="#fff" /> // Show loading indicator
                ) : (
                  <>
                    <ReceiptIndianRupee size={16} color="white" className="mr-2" />
                    <Text className="ml-2 text-white">Summary</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center border-b border-gray-300 px-4 py-3"
                onPress={() => {
                  exportSale();
                  setShowExportMenu(false);
                }}>
                <TrendingUp size={16} color="white" className="mr-2" />
                <Text className="ml-2 text-white">Revenue</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-row items-center px-4 py-3"
                onPress={() => {
                  exportExpense();
                  setShowExportMenu(false);
                }}>
                <TrendingDown size={16} color="white" className="mr-2" />
                <Text className="ml-2 text-white">Expense</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Month/Year Selection */}
          <View className="bg-white p-4 shadow-sm">
            <View className="flex-row items-center justify-between">
              <View className="mr-5 flex-1 justify-between">
                <View className="h-12 flex-row items-center rounded-lg border border-green-500 bg-green-50 px-2">
                  <CalendarIcon size={16} color="green" />
                  <Picker
                    selectedValue={selectedMonth}
                    onValueChange={(val) => setSelectedMonth(val)}
                    style={{ height: 20, flex: 1, color: 'green' }}
                    dropdownIconColor="green">
                    {months.map((month, idx) => (
                      <Picker.Item
                        key={idx}
                        label={month}
                        value={idx + 1}
                        style={{ fontSize: 14 }}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              <View className="flex-1">
                <View className="h-12 flex-row items-center rounded-lg border border-green-500 bg-green-50 px-3">
                  <CalendarIcon size={16} color="green" />
                  <Picker
                    selectedValue={selectedYear}
                    onValueChange={(val) => setSelectedYear(val)}
                    style={{ height: 40, flex: 1, color: 'green' }}
                    dropdownIconColor="green">
                    {years.map((year) => (
                      <Picker.Item
                        key={year}
                        label={year.toString()}
                        value={year}
                        style={{ fontSize: 14 }}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>
          </View>

          {/* Report Content */}
          <ScrollView
            className="p-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 50 }}>
            {/* Revenue Trend Graph */}
            <ViewShot ref={lineChartRef} options={{ format: 'png', quality: 1 }}>
              <View className="mb-4 rounded-xl bg-white p-4 shadow-sm">
                <View className="mb-3 flex-row items-center justify-between">
                  <Text className="text-lg font-semibold text-gray-700">Revenue Trend</Text>
                  <View className="flex-row items-center">
                    {revenueChange.isPositive ? (
                      <ArrowUp size={16} color="#10B981" />
                    ) : (
                      <ArrowDown size={16} color="#EF4444" />
                    )}
                    <Text
                      className={`ml-1 text-sm ${revenueChange.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {Math.abs(revenueChange.percentage).toFixed(1)}% from last month
                    </Text>
                  </View>
                </View>

                <LineChart
                  data={{
                    labels: getMonthLabels(),
                    datasets: [
                      {
                        data: reportData.revenue.trend,
                        color: () => '#10B981',
                      },
                    ],
                  }}
                  width={screenWidth}
                  height={180}
                  chartConfig={chartConfig}
                  bezier
                  withHorizontalLabels={true}
                  withVerticalLabels={true}
                  withInnerLines={false}
                  withOuterLines={false}
                  renderDotContent={({ x, y, index, indexData }) => (
                    <Text
                      key={index}
                      style={{
                        position: 'absolute',
                        top: y - 20,
                        left: x - 10,
                        fontSize: 10,
                        color: '#10B981',
                      }}>
                      {indexData}
                    </Text>
                  )}
                />
              </View>
            </ViewShot>

            {/* Key Metrics Cards */}
            <View className="mb-4 flex-row flex-wrap justify-between">
              {/* Revenue Card */}
              <View className="mb-3 w-[48%] rounded-lg bg-white p-4 shadow-sm">
                <Text className="text-sm font-medium text-gray-500">Revenue</Text>
                <Text className="mt-1 text-xl font-bold text-green-600">
                  ₹{reportData.revenue.current.toLocaleString()}
                </Text>
                <Text className="mt-1 text-sm font-semibold text-gray-400">
                  Prev Month ₹{reportData.revenue.previous.toLocaleString()}
                </Text>
                <View className="mt-2 flex-row items-center">
                  {revenueChange.isPositive ? (
                    <ArrowUp size={14} color="#10B981" />
                  ) : (
                    <ArrowDown size={14} color="#EF4444" />
                  )}
                  <Text
                    className={`ml-1 text-sm ${revenueChange.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    ₹{Math.abs(revenueChange.amount).toLocaleString()} (
                    {Math.abs(revenueChange.percentage).toFixed(1)}%)
                  </Text>
                </View>
              </View>

              {/* Expense Card */}
              <View className="mb-3 w-[48%] rounded-lg bg-white p-4 shadow-sm">
                <Text className="text-sm font-medium text-gray-500">Expenses</Text>
                <Text className="mt-1 text-xl font-bold text-green-600">
                  ₹{reportData.expense.current.toLocaleString()}
                </Text>
                <Text className="mt-1 text-sm font-semibold text-gray-400">
                  Prev Month ₹{reportData.expense.previous.toLocaleString()}
                </Text>
                <View className="mt-2 flex-row items-center">
                  {expenseChange.isPositive ? (
                    <ArrowUp size={14} color="#EF4444" />
                  ) : (
                    <ArrowDown size={14} color="#10B981" />
                  )}
                  <Text
                    className={`ml-1 text-sm ${expenseChange.isPositive ? 'text-red-500' : 'text-green-500'}`}>
                    ₹{Math.abs(expenseChange.amount).toLocaleString()} (
                    {Math.abs(expenseChange.percentage).toFixed(1)}%)
                  </Text>
                </View>
              </View>

              {/* Services Card */}
              <View className="w-[48%] rounded-lg bg-white p-4 shadow-sm">
                <Text className="text-sm font-medium text-gray-500">Services</Text>
                <Text className="mt-1 text-xl font-bold text-green-600">
                  {reportData.services.current.toLocaleString()}
                </Text>
                <Text className="mt-1 text-sm font-semibold text-gray-400">
                  Prev Month ₹{reportData.services.previous.toLocaleString()}
                </Text>
                <View className="mt-2 flex-row items-center">
                  {servicesChange.isPositive ? (
                    <ArrowUp size={14} color="#10B981" />
                  ) : (
                    <ArrowDown size={14} color="#EF4444" />
                  )}
                  <Text
                    className={`ml-1 text-sm ${servicesChange.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {Math.abs(servicesChange.amount).toLocaleString()} (
                    {Math.abs(servicesChange.percentage).toFixed(1)}%)
                  </Text>
                </View>
              </View>

              {/* Net Profit Card */}
              <View className="w-[48%] rounded-lg border border-green-100 bg-green-50 p-4 shadow-sm">
                <Text className="text-sm font-medium text-gray-700">Net Profit</Text>
                <Text className="mt-1 text-xl font-bold text-green-700">
                  ₹{netCurrent.toLocaleString()}
                </Text>
                <Text className="mt-1 text-sm font-semibold text-gray-400">
                  Prev Month ₹{netPrevious.toLocaleString()}
                </Text>
                <View className="mt-2 flex-row items-center">
                  {netChange.isPositive ? (
                    <ArrowUp size={14} color="#10B981" />
                  ) : (
                    <ArrowDown size={14} color="#EF4444" />
                  )}
                  <Text
                    className={`ml-1 text-sm ${netChange.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    ₹{Math.abs(netChange.amount).toLocaleString()} (
                    {Math.abs(netChange.percentage).toFixed(1)}%)
                  </Text>
                </View>
              </View>
            </View>

            {/* Expense Breakdown Pie Chart */}
            <View className="mb-4 rounded-xl bg-white p-4 shadow-sm">
              <Text className="mb-3 text-lg font-semibold text-gray-700">Expense Breakdown</Text>
              <ViewShot ref={pieChartRef} options={{ format: 'png', quality: 1 }}>
                <View className="flex-row">
                  <View className="ml-10 flex-1 items-center">
                    <PieChart
                      data={reportData.expense.categories}
                      width={screenWidth * 0.6}
                      height={160}
                      chartConfig={chartConfig}
                      accessor="amount"
                      backgroundColor="transparent"
                      paddingLeft="15"
                      hasLegend={false}
                    />
                  </View>
                  <View className="flex-1 justify-center pl-2">
                    {reportData.expense.categories.map((item, index) => (
                      <View key={index} className="mb-2 flex-row items-center">
                        <View
                          className="mr-2 h-3 w-3 rounded-sm"
                          style={{ backgroundColor: item.color }}
                        />
                        <Text className="flex-1 text-sm text-gray-700">{item.name}</Text>
                        <Text className="text-sm font-medium">₹{item.amount.toLocaleString()}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </ViewShot>
            </View>

            {/* Popular Services */}
            <View className="mb-4 rounded-xl bg-white p-4 shadow-sm">
              <Text className="mb-3 text-lg font-semibold text-gray-700">Popular Services</Text>
              {reportData.services.popularServices.map((service, index) => (
                <View key={index} className="mb-3">
                  <View className="mb-1 flex-row justify-between">
                    <Text className="text-sm text-gray-700">{service.name}</Text>
                    <Text className="text-sm font-medium">{service.count} services</Text>
                  </View>
                  <View className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <View
                      className="h-full rounded-full bg-green-500"
                      style={{ width: `${(service.count / reportData.services.current) * 100}%` }}
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* Customer Metrics */}
            <View className="rounded-xl bg-white p-4 shadow-sm">
              <Text className="mb-3 text-lg font-semibold text-gray-700">Customer Metrics</Text>
              <View className="flex-row justify-between">
                {reportData.customerCategories.map((category, index) => (
                  <View key={index} className="items-center">
                    <Text className="text-2xl font-bold text-green-600">{category.total}</Text>
                    <Text className="text-sm text-gray-500">{category.category}</Text>
                  </View>
                ))}
                <View className="items-center">
                  <Text className="text-2xl font-bold text-green-600">{totalCustomers}</Text>
                  <Text className="text-sm text-gray-500">Total</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      {/* </TouchableWithoutFeedback> */}
    </View>
  );
};

export default MonthlyReportScreen;
