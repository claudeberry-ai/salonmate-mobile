import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { RootStackParamList } from '../../navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { getReq, putReq } from '~/api/api';
import LoadingIndicator from '~/components/Loading/LoadingIndicator';
import { printReceipt } from '~/components/Printer/PrintReceipt';
import { usePrinter } from '~/components/Printer/PrinterContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '~/constants/backend';
import PaymentModal from '~/components/Modals/PaymentsModal';
import { BleManager } from 'react-native-ble-plx';

type Props = NativeStackScreenProps<RootStackParamList, 'InvoiceDetail'>;

type SaleData = {
  saleId: number;
  invoiceNumber: string;
  date: string;
  discount: number;
  enteredBy: string;
  paymentMethod: string;
  totalAdditionalCharges: number;
  services: Service[];
};

type Service = {
  name: string;
  rate: number;
  additionalCharge: number;
  staff: string;
};
type user = {
  userId: number;
  salonId: number;
  userName: string;
  userType: number;
  salonName: string;
  salonAddr: string;
  salonCity: string;
  salonContact: string;
  reportAccess: number;
};

const InvoiceDetail = ({ route, navigation }: Props) => {
  const { invoiceId } = route.params;

  const [saleData, setSaleData] = useState<SaleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<user | null>(null);

  const [isPaymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(saleData?.paymentMethod);

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
    const getSaleData = async () => {
      if (!invoiceId) return;
      try {
        const url = `api/sale/getSaleDetails/${invoiceId}`;
        const response = await getReq(url);
        setSaleData(response.data[0]);
      } catch (error) {
        console.error('Error fetching invoice data:', error);
      }
    };
    getSaleData();
  }, [invoiceId]);

  if (!saleData) {
    return <LoadingIndicator color="blue" text="Loading Invoice data..." />;
  }

  // Calculate totals
  const subtotal = saleData.services.reduce((sum, service) => sum + service.rate, 0);
  const netAmount = subtotal + saleData.totalAdditionalCharges - saleData.discount;

  const handlePrint = async () => {
    try {
      // Check Bluetooth state
      const bleManager = new BleManager();
      const state = await bleManager.state();

      if (state != 'PoweredOn') {
        // Bluetooth is on, proceed
        Alert.alert('Bluetooth Required', 'Please enable Bluetooth to connect to the printer');
        return;
      }
      setLoading(true);
      await printReceipt(saleData);
    } catch (error) {
      console.error('Bluetooth check error:', error);
      Alert.alert('Error', 'Failed to check Bluetooth status');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    Alert.alert('Confirm Delete', 'Are you sure you want to delete this invoice?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const data = {
            saleId: invoiceId,
            userId: user?.userId,
          };

          const url = 'api/sale/deleteInvoice';
          try {
            const response = await putReq(url, data);
            if (response.success == true) {
              Alert.alert('Success', 'Invoice deleted successfully !');
            } else {
              Alert.alert('Error', 'Failed to delete invoice !');
            }
            // Optionally, refresh sales data or navigate back after deletion
          } catch (error) {
            console.error('Error deleting invoice:', error);
          } finally {
            navigation.replace('CurrentSale');
          }
        },
      },
    ]);
  };

  const openPaymentModal = () => {
    setPaymentModalVisible(true);
  };

  const handlePaymentChange = async (newPaymentMethod: { paymentMethod: string }) => {
    setSelectedPaymentMethod(newPaymentMethod.paymentMethod);

    const data = {
      saleId: invoiceId,
      paymentType:
        newPaymentMethod.paymentMethod === 'Cash'
          ? 0
          : newPaymentMethod.paymentMethod === 'UPI'
            ? 1
            : 2,
    };
    try {
      setLoading(true);

      const url = 'api/sale/updatePayment';

      const response = await putReq(url, data);

      if (response.success == true) {
        Alert.alert('Success', 'Payment method changed successfully!');
      } else {
        Alert.alert('Error', 'Failed to change payment method !');
      }
      navigation.replace('CurrentSale');
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingIndicator color="purple" />;

  return (
    <View className="flex-1 bg-gray-100">
      <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-4 rounded-lg p-4">
          <View className="mb-3 flex-col items-center">
            <Text className="text-center text-2xl font-bold text-purple-700">
              Invoice #{saleData.invoiceNumber}
            </Text>
            <View className="mt-2 h-1 w-32 rounded-full bg-yellow-500" />
          </View>

          <Text className="text-md mt-1 font-semibold text-gray-600">{saleData.date}</Text>
          <Text className="mt-1 text-lg font-semibold text-gray-600">
            Entered by: {saleData.enteredBy}
          </Text>
        </View>

        {/* Services Table */}
        <View className="mb-4 rounded-lg bg-white shadow-sm">
          <View className="flex-row justify-between border-b border-gray-200 p-3">
            <Text className="flex-1 text-lg font-bold text-purple-700">Service</Text>
            <Text className="flex-1 text-center text-lg font-bold text-purple-700">Staff</Text>
            <Text className="w-20 text-center text-lg font-bold text-purple-700">Rate</Text>
            <Text className="w-12 text-center text-lg font-bold text-purple-700">Add.</Text>
          </View>

          {saleData.services.map((service, index) => (
            <View
              key={index}
              className={`flex-row justify-between p-3 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
              <Text className="flex-1 font-semibold text-gray-800">{service.name}</Text>
              <Text className="flex-1 text-center text-gray-800">{service.staff}</Text>
              <Text className="w-20 text-center text-gray-800">₹{service.rate}</Text>
              <Text className="w-12 text-center text-gray-800">
                {service.additionalCharge > 0 ? `₹${service.additionalCharge}` : '-'}
              </Text>
            </View>
          ))}
        </View>

        {/* Amount Details */}
        <View className="mb-8 mt-3 rounded-lg bg-white p-4 shadow-sm">
          <View className="flex-row justify-between border-b border-gray-100 py-2">
            <Text className="text-gray-600">Subtotal</Text>
            <Text className="font-medium">₹{subtotal}</Text>
          </View>
          <View className="flex-row justify-between border-b border-gray-100 py-2">
            <Text className="text-gray-600">Additional Charges</Text>
            <Text className="font-medium">₹{saleData.totalAdditionalCharges}</Text>
          </View>
          <View className="flex-row justify-between border-b border-gray-100 py-2">
            <Text className="text-gray-600">Discount</Text>
            <Text className="font-medium text-red-500">-₹{saleData.discount}</Text>
          </View>
          <View className="flex-row justify-between py-3">
            <Text className="text-lg font-bold text-purple-700">Net Amount</Text>
            <Text className="text-lg font-bold text-purple-700">₹{netAmount.toFixed(2)}</Text>
          </View>
          <View className="mt-2 flex-row border-t border-gray-100 pt-2">
            <Text className="text-gray-600">Payment Method:</Text>
            <Text className="font-semibold text-gray-600"> {saleData.paymentMethod}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View className="flex-row border-t border-gray-200 bg-white p-4">
        {(user?.userType == 0 || user?.reportAccess == 1) && (
          <TouchableOpacity
            onPress={handleDelete}
            className="mr-2 flex-1 items-center justify-center rounded-lg bg-red-200 py-3">
            <Text className="font-medium text-red-800">Delete</Text>
          </TouchableOpacity>
        )}
        {user?.userType != 2 && (
          <TouchableOpacity
            onPress={openPaymentModal}
            className="mr-2 flex-1 items-center justify-center rounded-lg bg-gray-200 px-1 py-3">
            <Text className="font-medium text-purple-700">Change Payment</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={handlePrint}
          className="flex-1 items-center justify-center rounded-lg bg-purple-700 py-3">
          <Text className="font-medium text-white">Print</Text>
        </TouchableOpacity>
      </View>
      <PaymentModal
        visible={isPaymentModalVisible}
        onClose={() => setPaymentModalVisible(false)}
        onConfirm={handlePaymentChange}
        totalAmount={0}
        totalAdditionalCharges={0}
        serviceCount={0}
        isChangePaymentOnly={true} // Pass this to hide other fields
      />
    </View>
  );
};

export default InvoiceDetail;
