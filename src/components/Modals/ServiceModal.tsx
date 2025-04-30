import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput } from 'react-native';

interface AddServiceModalProps {
  visible: boolean;
  onClose: () => void;
  onAddService: (service: { name: string; category: string }) => void;
}

// Define the type for service categories
type ServiceCategory = 'Men' | 'Women' | 'Kids';

const AddServiceModal: React.FC<AddServiceModalProps> = ({ visible, onClose, onAddService }) => {
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>('Men');
  const [searchQuery, setSearchQuery] = useState('');

  // Dummy services by category
  const servicesByCategory: Record<ServiceCategory, string[]> = {
    Men: ['Haircut', 'Beard Trim', 'Shave', 'Hair Coloring'],
    Women: ['Haircut', 'Blow Dry', 'Manicure', 'Pedicure', 'Facial'],
    Kids: ['Haircut', 'Braids', 'Nail Art', 'Kids Hair Styling'],
  };

  // Filter services based on search query
  const filteredServices = servicesByCategory[selectedCategory].filter((service) =>
    service.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 items-center justify-center bg-black/60 bg-opacity-50">
        <View className="w-80 rounded-lg bg-white p-5">
          <Text className="mb-4 text-lg font-semibold text-gray-800">Select Service</Text>

          {/* Search Input */}
          <TextInput
            className="mb-4 rounded-lg bg-gray-100 p-2"
            placeholder="Search services..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />

          {/* Category Tabs */}
          <View className="mb-4 flex-row justify-around">
            {(['Men', 'Women', 'Kids'] as ServiceCategory[]).map((category) => (
              <TouchableOpacity
                key={category}
                className={`p-2 ${selectedCategory === category ? 'border-b-2 border-yellow-500' : ''}`}
                onPress={() => {
                  setSelectedCategory(category);
                  setSearchQuery(''); // Reset search query when category changes
                }}>
                <Text
                  className={`text-gray-800 ${selectedCategory === category ? 'font-bold' : ''}`}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Services List */}
          <FlatList
            data={filteredServices}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="border-b border-gray-200 p-3"
                onPress={() => onAddService({ name: item, category: selectedCategory })}>
                <Text className="text-gray-800">{item}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text className="mt-4 text-center text-gray-500">No services found</Text>
            }
          />

          {/* Close Button */}
          <TouchableOpacity className="mt-4 rounded-lg bg-yellow-500 p-3" onPress={onClose}>
            <Text className="text-center font-semibold text-black">Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default AddServiceModal;
