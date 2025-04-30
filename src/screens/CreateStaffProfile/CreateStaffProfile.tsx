import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { Check, Eye, EyeOff } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import TermsModal from '../../components/Modals/TermsAndConditionsModal';
import { MaterialIcons } from '@expo/vector-icons';
import { postReq, uploadWithImg } from '~/api/api';
import OTPModal from '../../components/Modals/OtpModal'; // Import the OTPModal
import LoadingIndicator from '~/components/Loading/LoadingIndicator';
import Config from '~/constants/backend';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { RootStackParamList } from '../../navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateStaffProfile'>;

type User = {
  userId: number;
  salonId: number;
  userName: string;
  userType: number;
};

const CreateStaffProfile = ({ navigation }: Props) => {
  // State variables
  const [user, setUser] = useState<User | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false); // State for OTP modal

  // Error states for each field
  const [nameError, setNameError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [contactError, setContactError] = useState(false);
  const [profilePicError, setProfilePicError] = useState(false);
  const [termsError, setTermsError] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  // Refs for focusing inputs
  const nameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const contactRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

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

  // Handle profile picture upload
  const handleUploadProfilePic = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to upload a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfilePic(result.assets[0].uri);
      setProfilePicError(false); // Reset error if picture is uploaded
    }
  };

  // Validate email format
  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Validate contact number (exactly 10 digits)
  const validateContact = (contact: string) => {
    const regex = /^\d{10}$/;
    return regex.test(contact);
  };

  // Handle form submission with validation
  const handleSubmit = async () => {
    if (!user) return;
    // Reset all errors
    setNameError(false);
    setEmailError(false);
    setContactError(false);
    setProfilePicError(false);
    setTermsError(false);

    // Check if all fields are filled
    let hasError = false;

    if (!name) {
      setNameError(true);
      nameRef.current?.focus();
      hasError = true;
    }
    if (!email) {
      setEmailError(true);
      if (!hasError) emailRef.current?.focus();
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError(true);
      if (!hasError) emailRef.current?.focus();
      hasError = true;
    }
    if (!contact) {
      setContactError(true);
      if (!hasError) contactRef.current?.focus();
      hasError = true;
    } else if (!validateContact(contact)) {
      setContactError(true);
      if (!hasError) contactRef.current?.focus();
      hasError = true;
    }

    if (!profilePic) {
      setProfilePicError(true);
      hasError = true;
    }
    if (!acceptTerms) {
      setTermsError(true);
      hasError = true;
    }

    if (hasError) {
      if (!name || !email || !contact) {
        Alert.alert('Error', 'Fill all fields.');
        return;
      }

      Alert.alert('Error', 'Please fix the errors in the form.');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('contact', contact);
      formData.append('password', '');
      formData.append('salonId', user?.salonId.toString());
      if (profilePic) {
        formData.append('profilePic', {
          uri: profilePic,
          type: 'image/jpeg',
          name: 'profile.jpg',
        } as any);
      }

      const url = 'api/users/register';

      const uploadData = await uploadWithImg(url, formData);

      if (uploadData.success == true) {
        setShowOTPModal(true);
      } else if (uploadData.message == 'User already Exists!') {
        Alert.alert('Error', 'User already Exist!');
      } else {
        Alert.alert('Error', 'Something went wrong! Try again later');
      }
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Something went wrong! Try again later');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP verification
  const handleVerifyOTP = async (otp: string) => {
    // Add logic to verify OTP with the backend

    const postData = {
      email: email,
      otp: otp,
    };

    const url = 'api/users/verify-otp';
    const response = await postReq(url, postData);

    if (response.success == true) {
      setShowOTPModal(false);
      Alert.alert('Success', 'Staff added successfully !');
      navigation.replace('StaffManagement');
    } else {
      Alert.alert('Error', 'Incorrect OTP !');
    }
  };

  if (isLoading) return <LoadingIndicator color="orange" text="Setting up things for you..." />;

  return (
    <ScrollView
      className="flex-1 bg-gray-100 p-5"
      contentContainerStyle={{ paddingBottom: 50 }} // Add extra padding at the bottom
    >
      {/* Logo and Welcome Message */}
      <View className="mt-5 items-center">
        <Text className="mt-1 text-2xl font-bold text-gray-800">Create New Account</Text>
      </View>

      {/* Profile Picture Upload */}
      <View className="mt-8 items-center">
        <TouchableOpacity onPress={handleUploadProfilePic}>
          <View
            style={{ height: 150, width: 150 }}
            className={`items-center justify-center rounded-full border-2 ${
              profilePicError ? 'border-red-500' : 'border-gray-200'
            } bg-gray-200`}>
            {profilePic ? (
              <Image
                style={{ height: 150, width: 150 }}
                source={{ uri: profilePic }}
                className="rounded-full"
              />
            ) : (
              <Text className="text-gray-500">Upload Photo</Text>
            )}
          </View>
          <View className="absolute bottom-0 right-0 rounded-full bg-white p-1 shadow">
            <MaterialIcons name="edit" size={20} color="#FFA500" />
          </View>
        </TouchableOpacity>
        {profilePicError && (
          <Text className="mt-2 text-red-500">Please upload a profile picture.</Text>
        )}
      </View>

      {/* Input Fields */}
      <View className="mt-8">
        <TextInput
          ref={nameRef}
          className={`mb-4 rounded-lg border-2 ${
            nameError ? 'border-red-500' : 'border-gray-200'
          } bg-white p-5`}
          placeholder="Full Name"
          value={name}
          onChangeText={(text) => {
            setName(text);
            setNameError(false); // Reset error when user types
          }}
          placeholderTextColor="#999"
        />
        <TextInput
          ref={emailRef}
          className={`mb-4 rounded-lg border-2 ${
            emailError ? 'border-red-500' : 'border-gray-200'
          } bg-white p-5`}
          placeholder="Email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setEmailError(false); // Reset error when user types
          }}
          keyboardType="email-address"
          placeholderTextColor="#999"
        />
        <TextInput
          ref={contactRef}
          className={`mb-4 rounded-lg border-2 ${
            contactError ? 'border-red-500' : 'border-gray-200'
          } bg-white p-5`}
          placeholder="Contact Number"
          value={contact}
          onChangeText={(text) => {
            setContact(text);
            setContactError(false); // Reset error when user types
          }}
          keyboardType="phone-pad"
          placeholderTextColor="#999"
        />
      </View>

      {/* Terms and Conditions Checkbox */}
      <View className="mt-6 flex-row items-center justify-center">
        <TouchableOpacity
          className="mr-2 h-7 w-7 items-center justify-center rounded-sm border border-gray-400"
          onPress={() => {
            setAcceptTerms(!acceptTerms);
            setTermsError(false); // Reset error when user clicks
          }}>
          {acceptTerms && <Check size={20} color="#000" />}
        </TouchableOpacity>
        <Text className="text-lg text-gray-800">
          I accept the{' '}
          <Text className="text-yellow-500 underline" onPress={() => setShowTermsModal(true)}>
            Terms & Conditions
          </Text>
        </Text>
      </View>
      {termsError && (
        <Text className="mt-2 text-center text-red-500">Please accept the terms.</Text>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        className="mt-10 flex-row items-center justify-center rounded-lg bg-yellow-500 p-4"
        onPress={handleSubmit}>
        <Text className="font-bold  text-black">Create Account</Text>
      </TouchableOpacity>

      {/* Terms and Conditions Modal */}
      <TermsModal visible={showTermsModal} onClose={() => setShowTermsModal(false)} />

      {/* OTP Modal */}
      <OTPModal
        visible={showOTPModal}
        email={email}
        onClose={() => setShowOTPModal(false)}
        onVerify={handleVerifyOTP}
      />
    </ScrollView>
  );
};

export default CreateStaffProfile;
