import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  findNodeHandle,
} from 'react-native';
import {
  Ionicons,
  FontAwesome,
  FontAwesome5,
  MaterialIcons,
  MaterialCommunityIcons,
  Feather,
} from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import SelectStaffModal from '~/components/Modals/SelectStaffModal';
import CustomerDetailsModal from '~/components/Modals/CustomerDetailsModal';
import PaymentModal from '~/components/Modals/PaymentsModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '~/constants/backend';
import { getReq, postReq } from '~/api/api';
import { BleManager } from 'react-native-ble-plx';

import { usePrinter } from '../../components/Printer/PrinterContext';
import { printReceipt } from '~/components/Printer/PrintReceipt';
import LoadingIndicator from '~/components/Loading/LoadingIndicator';

type Props = NativeStackScreenProps<RootStackParamList, 'Cart'>;

// Define the type for a service
interface Service {
  serviceId: number;
  name: string;
  rate: number;
  qty: number;
  total: number;
  category: string;
  icon?: string; // Optional since it doesn't appear in your data
}

type user = {
  userId: number;
  salonId: number;
  userName: string;
  userType: number;
  salonName: string;
  salonAddr: string;
  salonCity: string;
  salonContact: string;
};

type staff = {
  userId: number;
  userName: string;
  profilePicSigned?: string;
};

// Define the type for the cart
type Cart = Record<number, Service>;

const CartScreen = ({ route, navigation }: Props) => {
  const { selectedServices } = route.params as {
    selectedServices: Cart;
  };

  const [cart, setCart] = useState<Cart>(selectedServices);
  const [additionalCharges, setAdditionalCharges] = useState<Record<number, number>>({});
  const [staffAssignments, setStaffAssignments] = useState<
    Record<number, { userId: number; userName: string }>
  >({});
  const [isStaffModalVisible, setIsStaffModalVisible] = useState(false);
  const [isCustomerModalVisible, setIsCustomerModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);

  const [user, setUser] = useState<user | null>(null);
  const [staffList, setStaffList] = useState<staff[]>([]);
  const [customerDetails, setCustomerDetails] = useState<{
    name: string;
    phone: string;
    email: string;
  } | null>(null);

  // const { printer, setPrinter } = usePrinter();

  const [printReq, setPrintReq] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const user = await AsyncStorage.getItem(Config.AsyncUserKey);
      if (user) {
        const parsedUser = JSON.parse(user);
        setUser(parsedUser);
        if (parsedUser.defaultPrint == 1) setPrintReq(true);
        else setPrintReq(false);
      }
    };

    getUser();
  }, []);

  useEffect(() => {
    const getStaffs = async () => {
      const url = `api/salons/getAllServiceUsers/${user?.salonId}`;
      const staffs = await getReq(url);

      setStaffList(staffs);
    };

    getStaffs();
  }, [user]);

  // Update additional charges
  const updateAdditionalCharge = (serviceId: number, amount: string) => {
    setAdditionalCharges({ ...additionalCharges, [serviceId]: parseFloat(amount) || 0 });
  };

  // Open staff selection modal
  const openStaffModal = (serviceId: number) => {
    if (!staffList || staffList == null || staffList == undefined) return;
    setSelectedServiceId(serviceId);
    setIsStaffModalVisible(true);
  };

  // Assign staff to service
  const assignStaff = (selectedStaff: staff) => {
    if (selectedServiceId !== null) {
      setStaffAssignments((prev) => ({
        ...prev,
        [selectedServiceId]: { userId: selectedStaff.userId, userName: selectedStaff.userName },
      }));
      setIsStaffModalVisible(false);
    }
  };

  // Calculate total price for a service (including additional charges)
  const calculateTotal = (serviceKey: number, rate: number, qty: number) => {
    const additionalCharge = additionalCharges[serviceKey] || 0;
    return rate * qty + additionalCharge;
  };

  // Calculate grand total for all services
  const grandTotal = Object.entries(cart).reduce(
    (total, [key, service]) => total + calculateTotal(Number(key), service.rate, service.qty),
    0
  );

  const totalAmount = Object.values(cart).reduce((total, service) => total + service.rate, 0);

  const totalAdditionalCharges = Object.values(additionalCharges).reduce(
    (total, charge) => total + (charge || 0),
    0
  );

  const serviceCount = Object.keys(cart).length;

  const validateStaffAssignment = () => {
    return Object.keys(cart).every((key) => staffAssignments[Number(key)]);
  };

  // Open payment modal if all staff are assigned
  const handlePrint = async () => {
    if (!validateStaffAssignment()) {
      Alert.alert('Error', 'Please assign staff for all services.');
      return;
    }
    if (printReq) {
      try {
        // Check Bluetooth state
        const bleManager = new BleManager();
        const state = await bleManager.state();

        if (state === 'PoweredOn') {
          // Bluetooth is on, proceed
          setIsPaymentModalVisible(true);
        } else {
          // Bluetooth is off, request to turn it on
          Alert.alert('Bluetooth Required', 'Please enable Bluetooth to connect to the printer');
        }
      } catch (error) {
        console.error('Bluetooth check error:', error);
        Alert.alert('Error', 'Failed to check Bluetooth status');
      }
    } else {
      setIsPaymentModalVisible(true);
    }
  };

  const handlePaymentConfirm = async (paymentData: {
    serviceCount: any;
    totalAmount: any;
    totalAdditionalCharges: any;
    discount: any;
    netAmount: any;
    paymentMethod: any;
  }) => {
    try {
      setLoading(true);
      const headerData = {
        serviceCount: paymentData.serviceCount,
        totalAmount: paymentData.totalAmount,
        totalAdditionalCharges: paymentData.totalAdditionalCharges,
        discount: paymentData.discount,
        netAmount: paymentData.netAmount,
        paymentMethod:
          paymentData.paymentMethod == 'Cash' ? 0 : paymentData.paymentMethod == 'UPI' ? 1 : 2,
        billName: customerDetails?.name || null,
        billContact: customerDetails?.phone || null,
        billEmail: customerDetails?.email || null,
      };

      const detailData = Object.entries(cart).map(([key, service]) => {
        const numKey = Number(key); // Convert key to number if required
        return {
          serviceId: service.serviceId,
          staffId: staffAssignments[numKey]?.userId || null,
          rate: service.rate,
          additionalCharge: additionalCharges[numKey] || 0,
          netAmount: calculateTotal(numKey, service.rate, service.qty),
        };
      });

      await saveInvoice(headerData, detailData);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const saveInvoice = async (headerData: any, detailData: any) => {
    const newSale = {
      userData: {
        userId: user?.userId,
        salonId: user?.salonId,
      },
      headerData: headerData,
      detailData: detailData,
    };
    const url = 'api/sale/newSale';
    const response = await postReq(url, newSale);

    const saleData = response.data[0];

    // const salonDetails = {
    //   salonName: user?.salonName,
    //   salonAddr: user?.salonAddr,
    //   salonCity: user?.salonCity,
    //   salonContact: user?.salonContact,
    // };

    if (printReq) await printReceipt(saleData);

    if (user?.userType == 2) {
      navigation.navigate('Home');
    } else navigation.replace('CurrentSale');
  };

  if (loading) return <LoadingIndicator color="purple" text="Saving Invoice..." />;

  return (
    <View className="flex-1 bg-white p-4">
      <View className="mx-2 mb-2 flex-col items-center justify-center pb-2">
        <Text className="mb-2 text-2xl font-bold text-violet-800">Confirm Invoice</Text>
        <View className=" h-1 w-32 rounded-full bg-yellow-500" />
      </View>

      <ScrollView className="flex-1">
        {Object.keys(cart).length > 0 ? (
          Object.entries(cart).map(([key, service]) => (
            <View key={key} className="mb-4 rounded-lg bg-gray-100 p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row">
                  <View className="justify-top items-center">
                    {service.category == 'Men' ? (
                      <Ionicons name="man" size={30} color="purple" />
                    ) : service.category == 'Women' ? (
                      <Ionicons name="woman" size={30} color="purple" />
                    ) : (
                      <FontAwesome className="mx-1.5 " name="child" size={30} color="purple" />
                    )}
                  </View>
                  <View>
                    <Text className="text-lg font-bold">{service.name}</Text>
                    <Text className="text-sm text-gray-500">₹{service.rate} per service</Text>
                  </View>
                </View>
                <View className="mt-2">
                  <Text className="text-sm text-gray-600">Additional Charges:</Text>
                  <TextInput
                    className="mt-1 rounded-lg border border-gray-300 bg-white p-2"
                    keyboardType="numeric"
                    placeholder="0"
                    value={additionalCharges[Number(key)]?.toString() || ''}
                    onChangeText={(value) => updateAdditionalCharge(Number(key), value)}
                  />
                </View>
              </View>

              <View className="flex-row justify-between">
                {/* Staff Selection */}
                <TouchableOpacity
                  className="mt-2 flex-row items-center justify-center rounded-lg bg-violet-100 p-2"
                  onPress={() => openStaffModal(Number(key))}>
                  <FontAwesome5 name="user" size={20} color="purple" />
                  <Text
                    className={`ml-3  ${staffAssignments[Number(key)] ? 'font-semibold text-violet-500' : 'text-red-600'}`}>
                    {staffAssignments[Number(key)]
                      ? staffAssignments[Number(key)].userName
                      : 'Select Staff'}
                  </Text>
                </TouchableOpacity>

                {/* Total for this service */}
                <View className="mt-2 flex-row items-center justify-center">
                  <Text className="text-md mr-3 text-gray-600">Total:</Text>
                  <Text className="text-lg font-bold text-violet-800">
                    ₹{calculateTotal(Number(key), service.rate, service.qty)}
                  </Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text className="text-center text-gray-500">No items in cart</Text>
        )}
      </ScrollView>

      {/* Grand Total */}
      <View className=" mt-4  flex-row items-center justify-between rounded-lg bg-gray-100 px-4 py-3">
        <Text className="text-xl font-bold text-violet-800">Grand Total: ₹{grandTotal}</Text>
        <Text className="text-lg font-semibold text-violet-500">(Services : {serviceCount})</Text>
      </View>

      {/* Customer Details Button */}
      <View className="flex-row justify-between">
        <TouchableOpacity
          style={{ flex: 2 }}
          className="mt-4 flex-row items-center justify-center rounded-lg bg-gray-100 p-3"
          onPress={() => setIsCustomerModalVisible(true)}>
          <FontAwesome5
            name="user"
            size={20}
            color={`${customerDetails?.name ? 'green' : '#D22B2B'}`}
          />
          <Text
            className={`text-md ml-4 text-center font-semibold ${customerDetails?.name ? 'text-green-600' : 'text-red-700'}`}>
            {customerDetails?.name || 'Add Customer'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={() => setPrintReq(!printReq)}
          className={`ml-5 mt-4 flex-row items-center rounded-lg px-2 py-1 ${
            printReq ? ' bg-green-100' : ' bg-gray-100'
          }`}>
          <View
            style={{ width: 25, height: 25 }}
            className={`mr-2 items-center justify-center rounded-full ${
              printReq ? 'bg-green-500' : 'bg-red-500'
            }`}>
            <MaterialCommunityIcons
              name={printReq ? 'printer-check' : 'printer-off'}
              size={20}
              color="white"
            />
          </View>
          <Text className={`font-medium ${printReq ? 'text-green-700' : 'text-gray-600'}`}>
            {printReq ? 'Print On' : 'Print Off'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Cancel and Print Buttons */}
      <View className="mt-4 flex-row justify-between">
        <TouchableOpacity className="mr-2 flex-1 flex-row items-center justify-center rounded-lg bg-gray-500 p-3">
          {/* <Feather name="delete" size={24} color="white" /> */}
          <Text className="text-center text-white">Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="ml-2 flex-1 flex-row items-center justify-center rounded-lg bg-violet-600 p-3"
          onPress={handlePrint}>
          {/* <Feather name="printer" size={24} color="white" /> */}
          <Text className="ml-3 text-center text-white">Save</Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <SelectStaffModal
        visible={isStaffModalVisible}
        staffList={staffList}
        onSelect={assignStaff}
        onClose={() => setIsStaffModalVisible(false)}
      />
      <CustomerDetailsModal
        visible={isCustomerModalVisible}
        onClose={() => setIsCustomerModalVisible(false)}
        onSave={(details) => setCustomerDetails(details)}
      />

      <PaymentModal
        visible={isPaymentModalVisible}
        totalAmount={totalAmount}
        totalAdditionalCharges={totalAdditionalCharges}
        serviceCount={serviceCount}
        onClose={() => setIsPaymentModalVisible(false)}
        onConfirm={handlePaymentConfirm}
      />
    </View>
  );
};

export default CartScreen;
