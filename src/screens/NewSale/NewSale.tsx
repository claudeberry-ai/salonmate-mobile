import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Animated } from 'react-native';
import { Ionicons, FontAwesome5, AntDesign } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { RootStackParamList } from '../../navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getReq } from '~/api/api';
import Config from '~/constants/backend';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Scissors } from 'lucide-react-native';
import LoadingIndicator from '~/components/Loading/LoadingIndicator';

type Props = NativeStackScreenProps<RootStackParamList, 'NewSale'>;

// Dummy service data
// const services = {
//   Men: [
//     { id: 1, name: 'Haircut', price: 200, icon: 'cut', duration: '30 mins' },
//     { id: 2, name: 'Shave', price: 100, icon: 'user-tie', duration: '20 mins' },
//   ],
//   Women: [
//     { id: 3, name: 'Hair Coloring', price: 500, icon: 'palette', duration: '1 hr' },
//     { id: 4, name: 'Facial', price: 400, icon: 'spa', duration: '45 mins' },
//   ],
//   Kids: [
//     { id: 5, name: 'Kids Haircut', price: 150, icon: 'child', duration: '25 mins' },
//     { id: 6, name: 'Braiding', price: 250, icon: 'grip-lines', duration: '40 mins' },
//   ],
// };

// Define a cart item type with unique entry ID
type CartItem = {
  entryId: string;
  serviceId: number;
  name: string;
  rate: number;
  category: string;
};

type Service = {
  time: number;
  id: number;
  name: string;
  price: number;
};

type user = {
  userId: number;
  salonId: number;
};
type Category = 'Men' | 'Women' | 'Kids';

const AddSaleServiceScreen = ({ navigation }: Props) => {
  const [selectedCategory, setSelectedCategory] = useState<'Men' | 'Women' | 'Kids'>('Men');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  // const [filteredServices, setFilteredServices] = useState(services[selectedCategory]);
  const [entryCounter, setEntryCounter] = useState(1);

  const [user, setUser] = useState<user | null>(null);
  const [loading, setLoading] = useState(true);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);

  const [services, setServices] = useState<Record<Category, Service[]>>({
    Men: [],
    Women: [],
    Kids: [],
  });

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await AsyncStorage.getItem(Config.AsyncUserKey);
        if (user) {
          const parsedUser = JSON.parse(user);
          setUser(parsedUser);
        } else {
          setLoading(false); // No user found
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setLoading(false); // Error case
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    const fetchServices = async () => {
      if (!user) {
        setLoading(false); // No user, can't fetch services
        return;
      }

      try {
        setLoading(true);
        const url = `api/services/getServices/${user?.salonId}`;
        const response = await getReq(url);

        if (response?.data) {
          setServices(response.data);
        } else {
          console.warn('No data received from API');
        }
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [user]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredServices(services[selectedCategory] || []);
    } else {
      setFilteredServices(
        services[selectedCategory].filter((service) =>
          service.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, selectedCategory, services]);

  // Count occurrences of a service in the cart
  const getServiceCount = (serviceId: number) => {
    return cart.filter((item) => item.serviceId === serviceId).length;
  };

  // Add a new service entry to cart
  const addServiceToCart = (serviceId: number, serviceName: string, servicePrice: number) => {
    setCart([
      ...cart,
      {
        entryId: entryCounter.toString(),
        serviceId,
        name: serviceName,
        rate: servicePrice,
        category: selectedCategory,
      },
    ]);
    setEntryCounter(entryCounter + 1); // Increment counter for next entry
  };

  // Remove the most recently added instance of a service
  const removeServiceFromCart = (serviceId: number) => {
    // Find indices of all entries with this service ID
    const indices = cart
      .map((item, index) => (item.serviceId === serviceId ? index : -1))
      .filter((index) => index !== -1);

    if (indices.length > 0) {
      // Get the last added entry (highest index)
      const lastIndex = Math.max(...indices);

      // Remove that entry
      setCart(cart.filter((_, index) => index !== lastIndex));
    }
  };

  // Convert cart for navigation - now keeps each entry separate
  const prepareCartForNavigation = () => {
    // Create an object where each entry has its own key
    const individualCart: Record<
      string,
      {
        serviceId: number;
        name: string;
        qty: number;
        rate: number;
        total: number;
        category: string;
      }
    > = {};

    cart.forEach((item) => {
      individualCart[item.entryId] = {
        serviceId: item.serviceId,
        name: item.name,
        qty: 1, // Each entry has qty of 1
        rate: item.rate,
        total: item.rate,
        category: item.category,
      };
    });

    return individualCart;
  };

  const handleCart = () => {
    const individualCart = prepareCartForNavigation();

    navigation.navigate('Cart', { selectedServices: individualCart });
  };

  if (loading) {
    return <LoadingIndicator color="purple" text="Loading Services" />;
  }

  return (
    <View className="flex-1 bg-white p-4">
      {/* Header */}
      <View className="flex-col justify-between">
        <Text className="text-2xl font-bold text-violet-800">New Service</Text>

        {/* Search Bar */}
      </View>

      {/* Category Tabs */}
      <View className="my-4 flex-col justify-around">
        <View className="flex-row items-center justify-around border-b-2 border-violet-700 pb-2">
          {(['Men', 'Women', 'Kids'] as const).map((category) => (
            <TouchableOpacity
              key={category}
              className={`rounded-lg px-4 py-2 `}
              onPress={() => {
                setSelectedCategory(category);
                setSearchQuery(''); // Reset search on category change
              }}>
              <Text
                className={` ${selectedCategory === category ? 'text-2xl font-bold text-violet-700' : 'text-md text-gray-500'}`}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View className="mt-3 flex-row items-center justify-center rounded-lg bg-purple-300">
          <View className="mx-2 items-center justify-center bg-purple-300 text-center">
            <Ionicons name="search" size={24} color="black" />
          </View>
          <TextInput
            placeholder="Search service..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="ox-4 flex-1 rounded-r-lg bg-purple-100 p-2 text-gray-700"
          />
        </View>
      </View>

      {/* Services List */}
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 50 }}>
        {filteredServices.length > 0 ? (
          filteredServices.map((service) => {
            const serviceCount = getServiceCount(service.id);

            return (
              <View
                key={service.id}
                className={`mb-3 flex-row items-center justify-between rounded-lg p-4 ${
                  serviceCount > 0 ? 'bg-violet-200' : 'bg-gray-100'
                }`}>
                {/* Left Section: Icon and Name */}
                <View className="mr-2 flex-1 flex-row items-center">
                  <Scissors size={20} color="purple" className="" />
                  <View className="ml-2 flex-1">
                    <Text
                      className="text-lg font-bold text-gray-800"
                      numberOfLines={2}
                      ellipsizeMode="tail">
                      {service.name}
                    </Text>
                    <Text className="text-sm text-gray-500">{service.time} Mins</Text>
                  </View>
                </View>

                {/* Right Section: Price & Counter */}
                <View className="flex-row items-center justify-end">
                  <Text className="text-lg font-bold text-violet-800">₹{service.price}</Text>

                  {/* Quantity Controls */}
                  <TouchableOpacity
                    onPress={() => removeServiceFromCart(service.id)}
                    disabled={serviceCount === 0}
                    className={`mx-2 rounded-full p-2 ${
                      serviceCount > 0 ? 'bg-violet-700' : 'bg-gray-300'
                    }`}>
                    <AntDesign name="minus" size={16} color="white" />
                  </TouchableOpacity>

                  <Text className="text-lg font-bold text-gray-800">{serviceCount}</Text>

                  <TouchableOpacity
                    onPress={() => addServiceToCart(service.id, service.name, service.price)}
                    className="mx-2 rounded-full bg-violet-700 p-2">
                    <AntDesign name="plus" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        ) : (
          <Text className="mt-5 text-center text-lg text-gray-500">No services found</Text>
        )}
      </ScrollView>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <TouchableOpacity
          className="absolute bottom-6 right-6 flex-row items-center rounded-full bg-violet-700 p-4 shadow-lg"
          onPress={handleCart}>
          <Ionicons name="cart" size={30} color="white" />
          <View className="absolute -right-2 -top-2 rounded-full bg-red-600 px-2">
            <Text className="text-sm font-bold text-white">{cart.length}</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default AddSaleServiceScreen;
