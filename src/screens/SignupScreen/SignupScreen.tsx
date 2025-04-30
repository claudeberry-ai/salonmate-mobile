import { useState, useRef, useLayoutEffect } from 'react';
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

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

const SignupPage = ({ navigation }: Props) => {
  // State variables
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false); // State for OTP modal

  // Error states for each field
  const [nameError, setNameError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [contactError, setContactError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);
  const [profilePicError, setProfilePicError] = useState(false);
  const [termsError, setTermsError] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  // Refs for focusing inputs
  const nameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const contactRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  // Handle profile picture upload
  const handleUploadProfilePic = async () => {
    Alert.alert(
      'Upload Profile Picture',
      'Choose an option',
      [
        {
          text: 'Camera',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              alert('Sorry, we need camera permissions to take a photo.');
              return;
            }
  
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 1,
            });
  
            if (!result.canceled) {
              setProfilePic(result.assets[0].uri);
              setProfilePicError(false);
            }
          },
        },
        {
          text: 'Gallery',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              alert('Sorry, we need gallery permissions to upload a profile picture.');
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
              setProfilePicError(false);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
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
    // Reset all errors
    setNameError(false);
    setEmailError(false);
    setContactError(false);
    setPasswordError(false);
    setConfirmPasswordError(false);
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
    if (!password) {
      setPasswordError(true);
      if (!hasError) passwordRef.current?.focus();
      hasError = true;
    }
    if (!confirmPassword) {
      setConfirmPasswordError(true);
      if (!hasError) confirmPasswordRef.current?.focus();
      hasError = true;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError(true);
      if (!hasError) confirmPasswordRef.current?.focus();
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
      if (!name || !email || !contact || !password || !confirmPassword) {
        Alert.alert('Error', 'Fill all fields.');
        return;
      }
      if (confirmPasswordError) {
        Alert.alert('Error', 'Passwords should match.');
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
      formData.append('password', password);
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

    const userData = response.user;

    if (response.success == true) {
      const user = {
        userId: userData.userId,
        userName: userData.userName,
        userContact: userData.userContact,
        userEmail: userData.userEmail,
        userType:userData.userType,
      };


      await AsyncStorage.setItem(Config.AsyncUserKey, JSON.stringify(user));
      Alert.alert('Success', 'OTP verified successfully!');
      setShowOTPModal(false);

      navigation.navigate('Welcome');
    } else {
      Alert.alert('Error', 'Incorrect OTP !');
    }
  };

  if (isLoading) return <LoadingIndicator color='orange' text='Setting up things for you...'/>;

  return (
    <ScrollView
      className="flex-1 bg-gray-100 p-5"
      contentContainerStyle={{ paddingBottom: 50 }} // Add extra padding at the bottom
    >
      {/* Logo and Welcome Message */}
      <View className="mt-10 items-center">
        <Text className="mt-1 text-2xl font-bold text-gray-800">Create Your Account</Text>
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
        <View
          className={`mb-4 flex-row items-center rounded-lg border-2 bg-white p-3 ${
            passwordError ? 'border-red-500' : 'border-gray-200'
          }`}>
          <TextInput
            className="flex-1"
            placeholder="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setPasswordError(false); // Reset error when user types
            }}
            secureTextEntry={!showPassword} // Toggle secureTextEntry
            placeholderTextColor="#999"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            {showPassword ? (
              <EyeOff size={25} color="#4B5563" />
            ) : (
              <Eye size={25} color="#4B5563" />
            )}
          </TouchableOpacity>
        </View>
        <View
          className={`mb-4 flex-row items-center rounded-lg border-2 border-gray-200 bg-white p-3 ${
            confirmPasswordError ? 'border-red-500' : 'border-gray-200'
          }`}>
          <TextInput
            className="flex-1"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setConfirmPasswordError(false); // Reset error when user types
            }}
            secureTextEntry={!showConfirmPassword} // Toggle secureTextEntry
            placeholderTextColor="#999"
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            {showConfirmPassword ? (
              <EyeOff size={25} color="#4B5563" />
            ) : (
              <Eye size={25} color="#4B5563" />
            )}
          </TouchableOpacity>
        </View>
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

export default SignupPage;
