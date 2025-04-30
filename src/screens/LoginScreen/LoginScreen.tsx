import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons'; // Icons for a modern look
import { LinearGradient } from 'expo-linear-gradient';
import RNFS from 'react-native-fs';
import FastImage from 'react-native-fast-image';

import { RootStackParamList } from '../../navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { postReq } from '~/api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '~/constants/backend';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen = ({ navigation }: Props) => {
  const [passwordVisible, setPasswordVisible] = useState(false);

  const [userName, setUserName] = useState('');
  const [userPass, setUserPass] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async () => {
    if (!userName || !userPass) {
      Alert.alert('Info', 'Enter your credentials');
      return;
    }
    setIsLoading(true);

    try {
      const user = {
        userName: userName,
        userPass: userPass,
      };

      const url = 'api/users/auth';

      const response = await postReq(url, user);

      if (response.success == false) {
        Alert.alert('Error', 'User not found!');
      } else {
        const userD = response.user;

        if (userD.signedUrl) {
          try {
            const downloadDest = `${RNFS.DocumentDirectoryPath}/${userD.salonId}_logo.jpg`;

            // Check if file exists and delete it
            try {
              const fileExists = await RNFS.exists(downloadDest);
              if (fileExists) {
                await RNFS.unlink(downloadDest);
              }
            } catch (deleteError) {
              console.warn('Error deleting existing file:', deleteError);
            }

            // Download new file
            const download = RNFS.downloadFile({
              fromUrl: userD.signedUrl,
              toFile: downloadDest,
              background: true,
              begin: (res) => {
                console.log('Download started:');
              },
              progress: (res) => {
                const progress = (res.bytesWritten / res.contentLength) * 100;
                // console.log(`Download progress: ${progress}%`);
              },
            });

            await download.promise;

            // Store path in AsyncStorage
            await AsyncStorage.setItem(Config.logoAsyncKey, downloadDest);
          } catch (downloadError) {
            console.warn('Failed to download image:', downloadError);
            // Optional: You might want to remove the key if download fails
            await AsyncStorage.removeItem(Config.logoAsyncKey);
          }
        }

        const userData = {
          userId: userD.userId,
          userName: userD.userName,
          userContact: userD.userContact,
          userEmail: userD.userEmail,
          userType: userD.userType,
          salonId: userD.salonId,
          salonName: userD.salonName,
          salonAddr: userD.salonAddr,
          salonCity: userD.salonCity,
          salonContact: userD.salonContact,
          salonEmail: userD.salonEmail,
          subLevel: userD.subLevel,
          reportAccess: userD.reportAccess,
          serviceStaff: userD.serviceStaff,
          appAccess: userD.appAccess,
          defaultPrint: userD.defaultPrinting,
          salonLogoPath: userD.signedUrl ? `${userD.salonId}_logo.jpg` : null,
        };

        await AsyncStorage.setItem(Config.AsyncUserKey, JSON.stringify(userData));
        if (userData.salonId) {
          navigation.replace('Home');
        } else {
          navigation.replace('CreateSalon');
        }
      }
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Logo Section */}
      <View className="flex h-2/5 items-center justify-center">
        <Image
          style={{ height: 200, width: 300 }}
          source={require('../../../assets/logo1.png')}
          // className="w-35 h-33"
          resizeMode="contain"
        />
        <Text className="text-center text-xl font-bold tracking-wide text-black">
          "Your life, simplified. One app to rule it all."
        </Text>
        <View className="mt-2 h-1 w-28 rounded-full bg-yellow-500" />
      </View>

      {/* Login Form */}
      <View className="flex-1 px-6 py-20">
        {/* Username Input */}
        <View className="mb-12 flex-row items-center space-x-3 rounded-xl bg-white p-4 shadow-sm">
          <FontAwesome className="mr-3" name="user" size={20} color="gray" />
          <TextInput
            placeholder="Username"
            value={userName}
            keyboardType="email-address"
            onChangeText={(text) => {
              setUserName(text);
            }}
            className="flex-1 text-base text-gray-800"
          />
        </View>

        {/* Password Input with Eye Icon */}
        <View className="mb-12 flex-row items-center justify-between rounded-xl bg-white p-4 shadow-sm">
          <View className="flex-1 flex-row items-center space-x-3">
            <FontAwesome className="mr-3" name="lock" size={20} color="gray" />
            <TextInput
              placeholder="Password"
              secureTextEntry={!passwordVisible}
              value={userPass}
              onChangeText={(text) => {
                setUserPass(text);
              }}
              className="flex-1 text-base text-gray-800"
            />
          </View>
          {/* Eye Icon Button */}
          <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
            <FontAwesome name={passwordVisible ? 'eye' : 'eye-slash'} size={20} color="gray" />
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          onPress={onSubmit}
          activeOpacity={0.8}
          className="mb-5 overflow-hidden rounded-xl">
          <LinearGradient
            colors={['#B8860B', '#FFD700', '#B8860B']} // Gold gradient
            start={{ x: 0, y: 5 }}
            end={{ x: 1, y: 1 }}
            className="p-4">
            <Text className="text-center text-lg font-bold tracking-wider text-black">
              {isLoading ? 'Verifying User...' : 'Login'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Signup Link */}
        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text className="text-center text-base text-yellow-800">New here? Sign Up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;
