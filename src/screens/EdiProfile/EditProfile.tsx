import { View, Text, TextInput, TouchableOpacity, Image, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '~/constants/backend';
import { getReq, uploadWithImg } from '~/api/api';

import * as ImagePicker from 'expo-image-picker';
import LoadingIndicator from '~/components/Loading/LoadingIndicator';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

type user = {
  userId: number;
  salonId: number;
  userName: string;
  userType: number;
};

type FullUser = {
  userId: number;
  salonId: number;
  userName: string;
  userType: number;
  signedUrl: string;
  userContact: string;
  userEmail: string;
  userBio: string | null;
  userPic: string;
};

const EditProfileScreen = ({ navigation }: Props) => {
  const [user, setUser] = useState<user | null>(null);
  const [fullUser, setFullUser] = useState<FullUser | null>(null);
  const [formData, setFormData] = useState({
    userName: '',
    userContact: '',
    userBio: '',
  });

  const [loading, setLoading] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(null);

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
    const getUser = async () => {
      if (!user) return;
      const url = `api/users/getUserInfo/${user.userId}`;
      const response = await getReq(url);

      if (response.success) {
        setFullUser(response.user);
        // Initialize form data with user data
        setFormData({
          userName: response.user.userName || '',
          userContact: response.user.userContact || '',
          userBio: response.user.userBio || '',
        });
      }
    };
    getUser();
  }, [user]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!fullUser || !user) return;

    try {
      setLoading(true);
      const formData1 = new FormData();

      formData1.append('id', user?.userId.toString());
      formData1.append('name', formData.userName);
      formData1.append('contact', formData.userContact);
      formData1.append('bio', formData.userBio);
      formData1.append('imgUrl', fullUser.userPic);
      if (profilePic) {
        formData1.append('profilePic', {
          uri: profilePic,
          type: 'image/jpeg',
          name: 'profile.jpg',
        } as any);
      }
      const url = 'api/users/edit';

      const uploadData = await uploadWithImg(url, formData1);

      if (uploadData.success == true) {
        const updatedData = {
          ...user,
          userName: formData.userName,
          userContact: formData.userContact,
        };

        await AsyncStorage.setItem(Config.AsyncUserKey, JSON.stringify(updatedData));

        alert('Profile updated successfully!');
        navigation.replace('Settings');
      } else {
        alert('Something went wrong');
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

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
    }
  };

  if (loading) return <LoadingIndicator color="orange" text="Updating Profile..." />;

  return (
    <ScrollView className="mb-3 flex-1 bg-gray-100">
      {/* Profile Picture Section */}
      <View style={{ flex: 1 }} className="mb-6 mt-6 items-center">
        <TouchableOpacity className="mt-2 items-center" onPress={handleUploadProfilePic}>
          {(profilePic || fullUser?.signedUrl) && (
            <Image
              style={{ height: 150, width: 150, borderRadius: 100, borderWidth: 2 }}
              source={{
                uri: profilePic ? profilePic : fullUser?.signedUrl,
              }}
              className="h-32 w-32 rounded-full border-4 border-orange-300"
            />
          )}

          <View className="absolute bottom-0 right-0 rounded-full bg-white p-1 shadow">
            <MaterialIcons name="edit" size={20} color="#FFA500" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Input Fields Section */}
      <View style={{ flex: 3 }} className="mt-4 px-5">
        {/* Name Input */}
        <View className="mb-4">
          <Text className="mb-2 font-semibold text-gray-700">Full Name</Text>
          <TextInput
            value={formData.userName}
            onChangeText={(text) => handleInputChange('userName', text)}
            className="rounded-lg border border-gray-200 bg-white p-4"
            placeholder="Your Name"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Email Input */}
        <View className="mb-4">
          <Text className="mb-2 font-semibold text-gray-700">Email</Text>
          <TextInput
            value={fullUser?.userEmail || ''}
            editable={false}
            className="rounded-lg border border-gray-200 bg-white p-4"
            placeholder="johndoe@example.com"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
          />
        </View>

        {/* Phone Number Input */}
        <View className="mb-4">
          <Text className="mb-2 font-semibold text-gray-700">Phone Number</Text>
          <TextInput
            value={formData.userContact}
            onChangeText={(text) => handleInputChange('userContact', text)}
            className="rounded-lg border border-gray-200 bg-white p-4"
            placeholder="Best Contact"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
          />
        </View>

        {/* Bio Input */}
        <View className="mb-6">
          <Text className="mb-2 font-semibold text-gray-700">Bio</Text>
          <TextInput
            value={formData.userBio}
            onChangeText={(text) => handleInputChange('userBio', text)}
            className="h-24 rounded-lg border border-gray-200 bg-white p-4"
            placeholder="Tell us about yourself..."
            placeholderTextColor="#9CA3AF"
            multiline
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          className="mb-3 items-center rounded-lg bg-orange-500 p-4 pb-4"
          onPress={handleSubmit}>
          <Text className="text-lg font-semibold text-white">Save Changes</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default EditProfileScreen;
