import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, Alert } from 'react-native';
import { PlusCircle } from 'lucide-react-native';

import { RootStackParamList } from '../../navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getReq, putReq } from '~/api/api';
import Config from '~/constants/backend';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoadingIndicator from '~/components/Loading/LoadingIndicator';
import EditServiceModal from '~/components/Modals/EditServiceModal';

type Props = NativeStackScreenProps<RootStackParamList, 'Services'>;

type Service = {
  id: number;
  name: string;
  price: string;
};

type user = {
  userId: number;
  salonId: number;
};

type Category = 'Men' | 'Women' | 'Kids';

export default function ServicesScreen({ navigation }: Props) {
  const [user, setUser] = useState<user | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category>('Men');
  const [services, setServices] = useState<Record<Category, Service[]>>({
    Men: [],
    Women: [],
    Kids: [],
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const categories: Category[] = ['Men', 'Women', 'Kids'];

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
    fetchServices();
  }, [user]);

  const fetchServices = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const url = `api/services/getServices/${user?.salonId}`;
      const data = await getReq(url);
      if (data && data.data) {
        setServices(data.data);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleServicePress = (service: Service) => {
    setSelectedService(service);
    setIsModalVisible(true);
  };

  const handleSaveService = async (id: number, name: string, price: string) => {
    try {
      const data = {
        serviceId: id,
        serviceName: name,
        serviceRate: price,
      };
      const url = `api/services/updateService`;
      const response = await putReq(url, data);

      if (response.success) {
        setIsModalVisible(false);
        Alert.alert('Success', 'Service updated successfully !');
        fetchServices();
      }
    } catch (error) {
      console.error('Error updating service:', error);
      Alert.alert('Error', 'Something went wrong');
    }
  };

  const handleDeleteService = async (id: number) => {
    Alert.alert('Confirm Deletion', 'Are you sure you want to delete this service?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const url = `api/services/deleteService`;
            const response = await putReq(url, { serviceId: id });

            if (response.success) {
              setIsModalVisible(false);
              Alert.alert('Success', 'Service deleted successfully!');
              fetchServices();
            }
          } catch (error) {
            console.error('Error deleting service:', error);
            Alert.alert('Error', 'Something went wrong');
          }
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-white p-5">
      <Text className="mb-2 text-2xl font-bold text-blue-600">Current Services</Text>

      <View className="mb-4 flex-row items-center justify-between border-b-2 border-b-blue-600 p-2">
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            className="mx-1 flex-1 items-center rounded-lg py-2"
            onPress={() => setSelectedCategory(category)}>
            <Text
              className={
                selectedCategory === category
                  ? 'text-2xl font-bold text-blue-500'
                  : 'text-lg text-gray-500'
              }>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search Input */}
      <TextInput
        className="mb-4 rounded-lg border border-gray-300 p-3 text-lg"
        placeholder="Search Services..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {loading ? (
        <LoadingIndicator color="blue" />
      ) : (
        <>
          <View className="flex-row rounded-t-lg bg-blue-400 p-3">
            <Text className="ml-5 flex-1 text-lg font-semibold text-white">Service</Text>
            <Text className="mr-5 w-24 text-right text-lg font-semibold text-white">Price</Text>
          </View>
          <FlatList
          contentContainerStyle={{paddingBottom:50}}
            data={filteredServices}
            ListEmptyComponent={
              <Text className="mt-3 text-center text-lg text-gray-500">Service Not Found</Text>
            }
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleServicePress(item)}
                className="flex-row border-b border-gray-300 p-5">
                <Text className="ml-2 flex-1 text-xl text-gray-800">{item.name}</Text>
                <Text className="mr-2 w-24 text-right text-xl text-gray-800">₹{item.price}</Text>
              </TouchableOpacity>
            )}
          />
        </>
      )}

      <TouchableOpacity
        onPress={() => navigation.navigate('AddService')}
        className="absolute bottom-5 right-5 rounded-full bg-blue-500 p-4 shadow-lg">
        <PlusCircle size={32} color="white" />
      </TouchableOpacity>

      <EditServiceModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onDelete={handleDeleteService}
        service={selectedService}
        onSave={handleSaveService}
      />
    </View>
  );
}
