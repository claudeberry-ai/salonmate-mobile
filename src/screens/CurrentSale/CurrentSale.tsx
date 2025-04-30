import { View, Text, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../../navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '~/constants/backend';
import { getReq } from '~/api/api';
import LoadingIndicator from '~/components/Loading/LoadingIndicator';

type Props = NativeStackScreenProps<RootStackParamList, 'CurrentSale'>;

type sale = {
  saleId: number;
  saleNum: string;
  saleTime: string;
  saleAmount: number;
  services: string;
  billName: string;
};
type user = {
  userId: number;
  salonId: number;
  userName: string;
  userType: number;
};

const SalesView = ({ navigation }: Props) => {
  const [user, setUser] = useState<user | null>(null);
  const [salesData, setSaleData] = useState<sale[]>([]);

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

  useEffect(() => {
    const getStaffs = async () => {
      if (!user) {
        return;
      }
      try {
        setIsLoading(true);
        const url = `api/sale/getDaysSale/${user.salonId}`;
        const sale = await getReq(url);

        const formattedSales = sale.data.map((saleItem: any) => {
          const serviceIds = saleItem.serviceId.split(', ').map((id: string) => id.trim());
          const serviceNames = saleItem.services.split(', ').map((name: string) => name.trim());

          const serviceCount: Record<string, { name: string; count: number }> = {};

          // Count occurrences based on serviceId
          serviceIds.forEach((id: number, index: number) => {
            const serviceName = serviceNames[index];
            if (serviceCount[id]) {
              serviceCount[id].count += 1;
            } else {
              serviceCount[id] = { name: serviceName, count: 1 };
            }
          });

          // Format as "Service Name (count)"
          const formattedServices = Object.values(serviceCount)
            .map(({ name, count }) => (count > 1 ? `${name} (${count})` : name))
            .join(', ');

          return { ...saleItem, services: formattedServices };
        });

        setSaleData(formattedSales);
      } catch (err) {
        console.log(err);
      } finally {
        setIsLoading(false);
      }
    };

    getStaffs();
  }, [user]);

  if (isLoading) return <LoadingIndicator color="#800080" />;

  return (
    <View className="flex-1 bg-gray-100 p-5">
      {/* Header */}
      <Text className="mb-4 text-2xl font-bold text-purple-700">
        Today's Services ({salesData.length})
      </Text>

      {/* Sales List */}
      <ScrollView className="mb-4" showsVerticalScrollIndicator={false}>
        {salesData.map((sale) => (
          <TouchableOpacity
            key={sale.saleId}
            className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-md"
            onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: sale.saleId })}>
            <View className="flex-row items-center justify-between">
              <View className="flex-col">
                <Text className="text-lg font-semibold text-gray-700">Invoice: {sale.saleNum}</Text>
                {sale.billName && (
                  <Text className="text-md text-gray-500">Cust: {sale.billName}</Text>
                )}
              </View>

              <Text className="text-sm text-gray-500">{sale.saleTime}</Text>
            </View>

            <Text className="mt-2 text-gray-600">
              Services: <Text className="font-semibold text-gray-700">{sale.services}</Text>
            </Text>

            <View className="mt-3 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-purple-700">Total: ₹{sale.saleAmount}</Text>
              <Ionicons name="receipt-outline" size={22} color="purple" />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Add New Sale Button */}
      <TouchableOpacity
        className="items-center rounded-xl bg-purple-700 py-3 shadow-lg"
        onPress={() => navigation.navigate('NewSale')}>
        <Text className="text-lg font-semibold text-white">+ New</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SalesView;
