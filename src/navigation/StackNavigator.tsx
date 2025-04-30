import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '~/screens/LoginScreen/LoginScreen';
import HomeScreen from '~/screens/HomeScreen/HomeScreen';
import { RootStackParamList } from './types';
import Header from '~/components/Header/Header';
import ServicesScreen from '~/screens/ServicesScreen/ServicesScreen';
import AddServiceScreen from '~/screens/AddServiceScreen/AddServicescreen';
import ReportsScreen from '~/screens/ReportsScreen/ReportsScreen';
import DailyReportScreen from '~/screens/DailyReportsScreen/DailyReportsScreen';
import NewSaleScreen from '~/screens/NewSale/NewSale';
import CartScreen from '~/screens/CartScreen/CartScreen';
import SalesView from '~/screens/CurrentSale/CurrentSale';
import SettingsScreen from '~/screens/SettingsScreen/SettingsScreen';
import EditProfileScreen from '~/screens/EdiProfile/EditProfile';
import ChangePasswordScreen from '~/screens/ChangePassword/ChangePassword';
import SalonManagementScreen from '~/screens/SalonManagementScreen/SalonManagementScreen';
import StaffManagementScreen from '~/screens/StaffManagementScreen/StaffManagementScreen';
import AppointmentSchedulingScreen from '~/screens/AppointmentScheduleScreen/AppointmentScheduleScreen';
import SignupPage from '~/screens/SignupScreen/SignupScreen';
import WelcomePage from '~/screens/WelcomPage/WelcomePage';

import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '~/constants/backend';
import LoadingIndicator from '~/components/Loading/LoadingIndicator';
import CreateSalonPage from '~/screens/CreateSalonScreen/CreateSalonScreen';
import { getReq, postReq } from '~/api/api';
import SubscriptionEndedScreen from '~/screens/SubscriptionEndedScreen/SubscriptionEndedScreen';
import PrinterList from '~/components/Printer/PrinterConnection';
import InvoiceDetail from '~/screens/InvoiceDetailScreen/InvoiceDetailScreen';
import StaffModifyScreen from '~/screens/StaffModifyScreen/StaffModifyScreen';
import CreateStaffProfile from '~/screens/CreateStaffProfile/CreateStaffProfile';
import UserPerformanceScreen from '~/screens/StaffPerformanceScreen/StaffPerformanceScreen';
import UpdateAvailableScreen from '~/screens/UpdateScreen/UpdateScreen';
import AddExpenseScreen from '~/screens/AddExpenseScreen/AddExpenseScreen';
import ExpenseGallery from '~/screens/ExpenseGalleryScreen/ExpenseGalleryScreen';
import MonthlyReportScreen from '~/screens/MonthlyReportScreen/MonthlyReportScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function StackNavigator() {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Login');
  const [loading, setLoading] = useState(true);

  const [subscriptionEnded, setSubscriptionEnded] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedKey = await AsyncStorage.getItem(Config.AsyncUserKey);

        if (!storedKey) {
          setInitialRoute('Login');
        } else {
          const user = JSON.parse(storedKey);

          const setUpdatedUser = await updateUserDetails(user.userEmail);

          if (!setUpdatedUser) return;

          if (setUpdatedUser.salonId == undefined || !setUpdatedUser.salonId) {
            setInitialRoute('Welcome');
          } else if (setUpdatedUser.salonId) {
            setInitialRoute('Home');
          } else {
            setInitialRoute('Login');
          }
        }
      } catch (error) {
        console.error('Error reading AsyncStorage:', error);
        setInitialRoute('Login');
      } finally {
        setLoading(false);
      }
    };

    const getAppData = async () => {
      const url = 'api/appData/getAppVersion';

      const response = await getReq(url);

      const db_version = response.data[0].memberValue;
      const app_version = Config.appVersion;

      if (db_version > app_version) setUpdateAvailable(true);
    };

    checkAuth();
    getAppData();
  }, []);

  const updateUserDetails = async (email: string) => {
    if (email)
      try {
        const url = 'api/users/getUserUpdates';
        const response = await postReq(url, { userEmail: email });

        const userD = response.user;

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
        };

        if (userD.subLevel == -1) {
          setSubscriptionEnded(true);
        }
        await AsyncStorage.setItem(Config.AsyncUserKey, JSON.stringify(userData));
        return userData;
      } catch (err) {
        console.log(err);
      }
  };

  if (loading) return <LoadingIndicator color="orange" />;

  if (subscriptionEnded) return <SubscriptionEndedScreen />;
  if (updateAvailable) return <UpdateAvailableScreen />;

  return initialRoute ? (
    <Stack.Navigator
      screenOptions={{ animation: 'fade_from_bottom' }}
      initialRouteName={initialRoute}>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Signup" component={SignupPage} options={{ headerShown: false }} />
      <Stack.Screen name="Welcome" component={WelcomePage} options={{ headerShown: false }} />
      <Stack.Screen
        name="CreateSalon"
        component={CreateSalonPage}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Home" component={HomeScreen} options={{ header: () => <Header /> }} />
      <Stack.Screen
        name="Services"
        component={ServicesScreen}
        options={{ header: () => <Header /> }}
      />
      <Stack.Screen
        name="AddService"
        component={AddServiceScreen}
        options={{ header: () => <Header /> }}
      />
      <Stack.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ header: () => <Header /> }}
      />
      <Stack.Screen
        name="DailyReports"
        component={DailyReportScreen}
        options={{ header: () => <Header /> }}
      />
      <Stack.Screen
        name="MonthlyReports"
        component={MonthlyReportScreen}
        options={{ header: () => <Header /> }}
      />
      <Stack.Screen
        name="CurrentSale"
        component={SalesView}
        options={{ header: () => <Header /> }}
      />
      <Stack.Screen
        name="InvoiceDetail"
        component={InvoiceDetail}
        options={{ header: () => <Header /> }}
      />
      <Stack.Screen
        name="NewSale"
        component={NewSaleScreen}
        options={{ header: () => <Header /> }}
      />
      <Stack.Screen name="Cart" component={CartScreen} options={{ header: () => <Header /> }} />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ header: () => <Header /> }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ header: () => <Header /> }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ header: () => <Header /> }}
      />
      <Stack.Screen
        name="SalonManagement"
        component={SalonManagementScreen}
        options={{ header: () => <Header /> }}
      />
      <Stack.Screen
        name="StaffManagement"
        component={StaffManagementScreen}
        options={{ header: () => <Header /> }}
      />
      <Stack.Screen
        name="AppointmentSchedule"
        component={AppointmentSchedulingScreen}
        options={{ header: () => <Header /> }}
      />
      <Stack.Screen
        name="StaffModify"
        component={StaffModifyScreen}
        options={{ header: () => <Header /> }}
      />
      <Stack.Screen
        name="StaffPerformance"
        component={UserPerformanceScreen}
        options={{ header: () => <Header /> }}
      />
      <Stack.Screen
        name="CreateStaffProfile"
        component={CreateStaffProfile}
        options={{ header: () => <Header /> }}
      />
      <Stack.Screen
        name="AddExpense"
        component={AddExpenseScreen}
        options={{ header: () => <Header /> }}
      />
      <Stack.Screen
        name="ExpenseGallery"
        component={ExpenseGallery}
        options={{ header: () => <Header /> }}
      />
      <Stack.Screen name="Printer" component={PrinterList} options={{ header: () => <Header /> }} />
    </Stack.Navigator>
  ) : null;
}
