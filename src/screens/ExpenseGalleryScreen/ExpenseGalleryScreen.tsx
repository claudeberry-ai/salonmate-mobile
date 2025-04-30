import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, Alert, Platform } from 'react-native';
import {
  ChevronDown,
  FileText,
  IndianRupee,
  Calendar as CalendarIcon,
  Download,
  File,
  Image as ImageIcon,
  PieChart,
} from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showMessage } from 'react-native-flash-message';

import { RootStackParamList } from '../../navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import Config from '~/constants/backend';
import { getReq } from '~/api/api';
import LoadingIndicator from '~/components/Loading/LoadingIndicator';

type Props = NativeStackScreenProps<RootStackParamList, 'ExpenseGallery'>;

type Expense = {
  expenseId: number;
  salonId: number;
  userId: number;
  expenseCat: number;
  expenseAmount: number;
  expenseDate: string;
  expenseDesc: string;
  attachment: string | null;
  updateTime: string;
  attachmentSigned: string | null;
};

type User = {
  userId: number;
  salonId: number;
};

const ExpenseGallery = () => {
  const [user, setUser] = useState<User | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

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
  const years = [currentYear - 1, currentYear];

  useEffect(() => {
    const fetchUser = async () => {
      const stored = await AsyncStorage.getItem(Config.AsyncUserKey);
      if (stored) setUser(JSON.parse(stored));
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) fetchExpenses();
  }, [user, selectedMonth, selectedYear]);

  const fetchExpenses = async () => {

    setLoading(true);
    try {
      const url = `api/expense/getExpenseByMonth?salon=${user?.salonId}&month=${selectedMonth}&year=${selectedYear}`;
      const { data } = await getReq(url);

      setExpenses(data || []);
    } catch (err) {
      console.error(err);
      showMessage({ message: 'Failed to load expenses', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const getCategory = (cat: number) => ['Purchase', 'Staff Salary', 'Other'][cat] ?? 'Unknown';

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const viewAttachment = async (uri: string) => {
    try {
      await Linking.openURL(uri);
    } catch {
      showMessage({ message: 'Could not open attachment', type: 'danger' });
    }
  };

  // Calculate category-wise totals and overall total
  const calculateSummary = () => {
    const summary = {
      purchase: 0,
      salary: 0,
      other: 0,
      total: 0,
    };

    expenses.forEach((expense) => {
      if (expense.expenseCat === 0) {
        summary.purchase += expense.expenseAmount;
      } else if (expense.expenseCat === 1) {
        summary.salary += expense.expenseAmount;
      } else {
        summary.other += expense.expenseAmount;
      }
      summary.total += expense.expenseAmount;
    });

    return summary;
  };

  const summary = calculateSummary();

  if (loading) return <LoadingIndicator color="#4f46e5" text="Loading Expense" />;
  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-6 py-4 shadow-sm">
        {/* Title */}
        <Text className="mb-4 text-2xl font-bold text-indigo-600">Expense Gallery</Text>

        {/* Summary Section */}

        {/* Filter Section */}
        <View className="rounded-xl  bg-white p-0">
          <View className="h-12 flex-row items-center justify-between space-x-14">
            {/* Month Picker */}
            <View className="mr-5 flex-1 justify-between">
              <View className="h-12 flex-row items-center rounded-lg border border-indigo-200 bg-indigo-50 px-2">
                <CalendarIcon size={16} color="#4f46e5" />
                <Picker
                  selectedValue={selectedMonth}
                  onValueChange={(val) => setSelectedMonth(val)}
                  style={{ height: 20, flex: 1, color: '#4f46e5' }}
                  dropdownIconColor="#4f46e5">
                  {months.map((month, idx) => (
                    <Picker.Item key={idx} label={month} value={idx + 1} style={{ fontSize: 14 }} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Year Picker */}
            <View className="flex-1">
              <View className="h-12 flex-row items-center rounded-lg border border-indigo-200 bg-indigo-50 px-3">
                <CalendarIcon size={16} color="#4f46e5" />
                <Picker
                  selectedValue={selectedYear}
                  onValueChange={(val) => setSelectedYear(val)}
                  style={{ height: 40, flex: 1, color: '#4f46e5' }}
                  dropdownIconColor="#4f46e5">
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
      </View>

      {/* Expenses List */}
      <ScrollView className="mb-5 p-4" contentContainerStyle={{ paddingBottom: 50 }}>
        <>
          <View className="bg-indigo-0 mb-4 rounded-xl border border-gray-300 px-6 pb-2 pt-4 ">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <PieChart size={20} color="indigo" />
                <Text className="ml-2 text-lg font-semibold text-indigo-600">Monthly Summary</Text>
              </View>
              <View className="flex-row items-center">
                <IndianRupee size={18} color="indigo" />
                <Text className="ml-1 text-xl font-bold text-indigo-600">{summary.total}</Text>
              </View>
            </View>

            <View className="mt-4 flex-row justify-between">
              <View className="items-center">
                <View className="h-3 w-3 rounded-full bg-blue-500" />
                <Text className="mt-1 text-sm font-semibold text-gray-500">Purchase</Text>
                <View className="flex-row items-center">
                  <IndianRupee size={12} color="black" />
                  <Text className="ml-1 text-sm font-semibold text-black">{summary.purchase}</Text>
                </View>
              </View>
              <View className="items-center">
                <View className="h-3 w-3 rounded-full bg-orange-500" />
                <Text className="mt-1 text-sm font-semibold text-gray-500">Salary</Text>
                <View className="flex-row items-center">
                  <IndianRupee size={12} color="black" />
                  <Text className="ml-1 text-sm font-semibold text-black">{summary.salary}</Text>
                </View>
              </View>
              <View className="items-center">
                <View className="h-3 w-3 rounded-full bg-green-600" />
                <Text className="mt-1 text-sm font-semibold text-gray-500">Other</Text>
                <View className="flex-row items-center">
                  <IndianRupee size={12} color="black" />
                  <Text className="ml-1 text-sm font-semibold text-black">{summary.other}</Text>
                </View>
              </View>
            </View>
          </View>
          {expenses && expenses.length == 0 ? (
            <View className="items-center justify-center rounded-lg  p-6 ">
              <FileText size={48} color="#9ca3af" />
              <Text className="mt-4 text-lg text-gray-500">No expenses found</Text>
            </View>
          ) : (
            <View className="space-y-3">
              {expenses.map((e) => (
                <View
                  key={e.expenseId}
                  className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                  <View className="flex-row items-start justify-between">
                    <View style={{ flex: 4 }}>
                      <View className="flex-row items-center">
                        <View
                          className={`mr-2 h-3 w-3 rounded-full ${
                            e.expenseCat === 0
                              ? 'bg-blue-500'
                              : e.expenseCat === 1
                                ? 'bg-orange-500'
                                : 'bg-green-500'
                          }`}
                        />
                        <Text className="text-lg font-semibold text-gray-800">
                          {getCategory(e.expenseCat)}
                        </Text>
                      </View>
                      <Text className="mt-1 text-sm text-gray-500">
                        {formatDate(e.expenseDate)}
                      </Text>
                    </View>
                    <View className="flex-row items-center justify-start" style={{ flex: 1 }}>
                      <IndianRupee size={16} color="#4f46e5" />
                      <Text className="ml-1 text-lg font-bold text-gray-800">
                        {e.expenseAmount}
                      </Text>
                    </View>
                  </View>

                  {!!e.expenseDesc && <Text className="mt-3 text-gray-600">{e.expenseDesc}</Text>}

                  {!!e.attachmentSigned && (
                    <View className="mt-4 flex-row space-x-3">
                      <TouchableOpacity
                        className="flex-row items-center rounded-lg bg-indigo-50 px-3 py-2"
                        onPress={() => viewAttachment(e.attachmentSigned!)}>
                        <File size={18} color="#4f46e5" />
                        <Text className="ml-2 text-indigo-600">View Receipt</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </>
      </ScrollView>
    </View>
  );
};

export default ExpenseGallery;
