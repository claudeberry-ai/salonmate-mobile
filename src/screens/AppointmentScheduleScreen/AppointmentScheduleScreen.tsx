import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, Clock, Save, Plus, Scissors } from 'lucide-react-native';
import SelectStaffModal from '~/components/Modals/SelectStaffModal'; // Reusing your existing modal
import AddServiceModal from '~/components/Modals/ServiceModal'; // New modal for adding services
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '~/constants/backend';
import { getReq } from '~/api/api';

interface Service {
  name: string;
  category: string;
  assignedStaff?: string;
}

type user = {
  userId: number;
  salonId: number;
  userName: string;
};

type staff = {
  userId: number;
  userName: string;
  profilePicSigned?: string;
};

const AppointmentScheduling = () => {
  // State variables
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [selectedServiceIndex, setSelectedServiceIndex] = useState<number | null>(null);

  // Dummy staff list
  const [user, setUser] = useState<user | null>(null);
  const [staffList, setStaffList] = useState<staff[]>([]);

  // Handle date change
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
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
    const getStaffs = async () => {
      const url = `api/salons/getAllUsers/${user?.salonId}`;
      const staffs = await getReq(url);

      setStaffList(staffs);
    };

    getStaffs();
  }, [user]);

  // Handle time change
  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      // Round the time to the nearest 30 minutes
      const minutes = selectedTime.getMinutes();
      const roundedMinutes = minutes < 30 ? 0 : 30;
      selectedTime.setMinutes(roundedMinutes, 0, 0); // Set seconds and milliseconds to 0
      setTime(selectedTime);
    }
  };

  // Handle adding a new service
  const handleAddService = (service: Service) => {
    setServices([...services, service]);
    setShowAddServiceModal(false);
  };

  // Handle assigning staff to a service
  const handleAssignStaff = (staffName: staff) => {
    if (selectedServiceIndex !== null) {
      const updatedServices = [...services];
      updatedServices[selectedServiceIndex].assignedStaff = staffName.userId.toString();
      setServices(updatedServices);
    }
    setShowStaffModal(false);
  };

  // Handle save appointment
  const handleSave = () => {
    const appointmentDetails = {
      customerName,
      phone,
      services,
      date: date.toDateString(),
      time: time.toLocaleTimeString(),
    };
    // Add logic to save the appointment (e.g., API call)
  };

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="mb-3 items-center justify-center pt-5">
        <Text className="text-2xl font-bold">New Appointment</Text>
        <View className="mt-2 h-1 w-28 rounded-full bg-yellow-500" />
      </View>

      {/* Scrollable Content */}
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Customer Name */}
        <View className="mb-5">
          <Text className="mb-2 text-lg font-semibold text-gray-800">Customer Name</Text>
          <TextInput
            className="rounded-lg border border-gray-200 bg-white p-3"
            placeholder="Enter customer name"
            value={customerName}
            onChangeText={setCustomerName}
            placeholderTextColor="#999"
          />
        </View>

        {/* Phone Number */}
        <View className="mb-5">
          <Text className="mb-2 text-lg font-semibold text-gray-800">Phone Number</Text>
          <TextInput
            className="rounded-lg border border-gray-200 bg-white p-3"
            placeholder="Enter phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholderTextColor="#999"
          />
        </View>

        {/* Add Services Section */}
        <View className="mb-5">
          <Text className="mb-2 text-lg font-semibold text-gray-800">Services</Text>
          <TouchableOpacity
            className="flex-row items-center rounded-lg border border-gray-200 bg-yellow-400 p-3"
            onPress={() => setShowAddServiceModal(true)}>
            <Plus size={20} color="#4B5563" />
            <Text className="ml-2 text-gray-700">Add Service</Text>
          </TouchableOpacity>

          {/* Display Added Services */}
          {services.map((service, index) => (
            <View key={index} className="ml-2 mt-3 w-full flex-row items-center">
              <Scissors size={20} color="#1e40af" />
              <View className="ml-5 w-10/12 flex-row items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
                <Text className="font-semibold text-gray-800">{service.name}</Text>
                <TouchableOpacity
                  className="mt-2 flex-row items-center"
                  onPress={() => {
                    setSelectedServiceIndex(index);
                    setShowStaffModal(true);
                  }}>
                  <View
                    className={`rounded-lg px-2 py-1 ${
                      service.assignedStaff ? `bg-yellow-300 ` : `bg-red-500 `
                    }`}>
                    <Text className={`text-gray-600 ${service.assignedStaff ? `` : `text-white `}`}>
                      {service.assignedStaff
                        ? `Assigned: ${service.assignedStaff}`
                        : 'Assign Staff'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Date Picker */}
        <View className="mb-5">
          <Text className="mb-2 text-lg font-semibold text-gray-800">Select Date</Text>
          <TouchableOpacity
            className="flex-row items-center rounded-lg border border-gray-200 bg-white p-3"
            onPress={() => setShowDatePicker(true)}>
            <Calendar size={20} color="#4B5563" />
            <Text className="ml-2 text-gray-700">{date.toDateString()}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={onDateChange}
              minimumDate={new Date()} // Disable previous dates
            />
          )}
        </View>

        {/* Time Picker */}
        <View className="mb-2">
          <Text className="mb-2 text-lg font-semibold text-gray-800">Select Time</Text>
          <TouchableOpacity
            className="flex-row items-center rounded-lg border border-gray-200 bg-white p-3"
            onPress={() => setShowTimePicker(true)}>
            <Clock size={20} color="#4B5563" />
            <Text className="ml-2 text-gray-700">{time.toLocaleTimeString()}</Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={time}
              mode="time"
              display="default"
              onChange={onTimeChange}
              minuteInterval={30} // Set time intervals to 30 minutes
            />
          )}
        </View>
        <View className="absolute bottom-0 left-0 right-0 p-5">
          <TouchableOpacity
            className="flex-row items-center justify-center rounded-lg bg-yellow-500 p-4"
            onPress={handleSave}>
            <Save size={20} color="#000" />
            <Text className="ml-2 font-semibold text-black">Save Appointment</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Save Button */}

      {/* Add Service Modal */}
      <AddServiceModal
        visible={showAddServiceModal}
        onClose={() => setShowAddServiceModal(false)}
        onAddService={handleAddService}
      />

      {/* Staff Assignment Modal */}
      <SelectStaffModal
        visible={showStaffModal}
        staffList={staffList}
        onSelect={handleAssignStaff}
        onClose={() => setShowStaffModal(false)}
      />
    </View>
  );
};

export default AppointmentScheduling;
