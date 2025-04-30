import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons, AntDesign, MaterialCommunityIcons, FontAwesome6 } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { printToFileAsync } from 'expo-print';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '~/constants/backend';
import { getReq, postReq, putReq } from '~/api/api';
import { Asset } from 'expo-asset';

// Load your logo asset
const logoAsset = Asset.fromModule(require('../../../assets/logo-text.png'));

type User = {
  userId: number;
  salonId: number;
  userName: string;
  userType: number;
};

type StaffSummary = {
  userId: number;
  userName: string;
  services: number;
  netAmount: string;
};

type PaymentSummary = {
  date: string;
  services: string;
  amount: string;
  discount: string;
  netAmount: string;
  Cash: string;
  UPI: string;
  Card: string;
};

type SaleDetail = {
  sdId: number;
  serviceId: number;
  serviceName: string;
  serviceRate: number;
  serviceAdditionalCharge: number;
  serviceNetAmount: number;
  performedByUserId: number;
  performedByName: string;
};

type Sale = {
  saleId: number;
  saleNum: string;
  totalServices: number;
  totalAmount: number;
  additionalCharge: number;
  discount: number;
  netAmount: number;
  billName: string | null;
  billContact: string | null;
  paymentType: number;
  enteredByUserId: number;
  enteredByName: string;
  details: SaleDetail[];
};

type ApiResponse = {
  success: boolean;
  data: {
    staffSummary: StaffSummary[];
    paymentSummary: PaymentSummary[];
    sales: Sale[];
  };
};

const DailyReportScreen = () => {
  const formatDateForStorage = (date: Date) => {
    return date.toISOString().split('T')[0].replace(/-/g, '');
  };

  const formatDateForUI = (date: Date) => {
    return date.toISOString().split('T')[0].split('-').reverse().join('-');
  };

  const [user, setUser] = useState<User | null>(null);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(formatDateForStorage(new Date()));
  const [formattedDate, setFormattedDate] = useState(formatDateForUI(new Date()));
  const [staffSummary, setStaffSummary] = useState<StaffSummary[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [logoUri, setLogoUri] = useState('');

  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null);

  // Load the logo
  useEffect(() => {
    const loadLogo = async () => {
      await logoAsset.downloadAsync();
      setLogoUri(logoAsset.localUri || '');
    };
    loadLogo();
  }, []);

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
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const data = {
          salonId: user.salonId,
          date: selectedDate,
        };
        const url = 'api/sale/getDailyReportSummary';
        const response: ApiResponse = await postReq(url, data);

        if (response.success) {
          setStaffSummary(response.data.staffSummary);
          if (response.data.paymentSummary.length > 0) {
            setPaymentSummary(response.data.paymentSummary[0]);
          } else {
            setPaymentSummary(null);
          }
          setSales(response.data.sales || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, selectedDate]);

  const handleDateChange = (event: any, date?: Date) => {
    if (event.type === 'set' && date) {
      const storedDate = formatDateForStorage(date);
      const displayedDate = formatDateForUI(date);
      setSelectedDate(storedDate);
      setFormattedDate(displayedDate);
    }
    setCalendarVisible(false);
  };

  const getPaymentType = (type: number) => {
    switch (type) {
      case 0:
        return 'Cash';
      case 1:
        return 'UPI';
      case 2:
        return 'Card';
      default:
        return 'Other';
    }
  };

  const exportToExcel = async () => {
    if (!paymentSummary || staffSummary.length === 0) return;

    // Prepare data for Summary sheet
    try {
      setExporting('excel');
      const summaryData = [
        ['Daily Report Summary', '', '', ''],
        ['Date', formattedDate, '', ''],
        ['', '', '', ''],
        ['Staff Performance', '', '', ''],
        ['Staff Name', 'Services', 'Earnings (₹)', ''],
        ...staffSummary.map((staff) => [staff.userName, staff.services, staff.netAmount, '']),
        ['', '', '', ''],
        ['Payment Summary', '', '', ''],
        ['Total Services', paymentSummary.services, '', ''],
        ['Total Amount (₹)', paymentSummary.amount, '', ''],
        ['Total Discount (₹)', paymentSummary.discount, '', ''],
        ['Net Amount (₹)', paymentSummary.netAmount, '', ''],
        ['', '', '', ''],
        ['Payment Methods', '', '', ''],
        ['Cash (₹)', paymentSummary.Cash, '', ''],
        ['UPI (₹)', paymentSummary.UPI, '', ''],
        ['Card (₹)', paymentSummary.Card, '', ''],
      ];

      // Prepare data for Sales sheet
      const salesHeader = [
        'Bill No',
        'Customer',
        'Contact',
        'Services',
        'Amount (₹)',
        'Additional (₹)',
        'Discount (₹)',
        'Net Amount (₹)',
        'Payment Type',
        'Entered By',
      ];

      const serviceHeader = [
        'Bill No',
        'Service',
        'Rate (₹)',
        'Additional (₹)',
        'Net Amount (₹)',
        'Performed By',
      ];

      const salesData = [
        salesHeader,
        ...sales.map((sale) => [
          sale.saleNum,
          sale.billName || 'N/A',
          sale.billContact || 'N/A',
          sale.totalServices,
          sale.totalAmount,
          sale.additionalCharge,
          sale.discount,
          sale.netAmount,
          getPaymentType(sale.paymentType),
          sale.enteredByName,
        ]),
        [],
        serviceHeader,
        ...sales.flatMap((sale) =>
          sale.details.map((detail) => [
            sale.saleNum,
            detail.serviceName,
            detail.serviceRate,
            detail.serviceAdditionalCharge,
            detail.serviceNetAmount,
            detail.performedByName,
          ])
        ),
      ];

      // Create workbook with two sheets
      const wb = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), 'Summary');

      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(salesData), 'Sales');

      // Generate file
      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const uri = FileSystem.cacheDirectory + `DailyReport_${formattedDate}.xlsx`;

      await FileSystem.writeAsStringAsync(uri, wbout, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Sharing.shareAsync(uri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Export Daily Report',
        UTI: 'com.microsoft.excel.xlsx',
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    } finally {
      setExporting(null);
    }
  };

  const exportToPDF = async () => {
    if (!paymentSummary || staffSummary.length === 0) return;

    try {
      setExporting('pdf');

      // // Convert logo to base64 for embedding in PDF
      // const logoBase64 = await FileSystem.readAsStringAsync(logoUri, {
      //   encoding: FileSystem.EncodingType.Base64,
      // });

      // HTML content for PDF
      const html = `
      <html>
        <head>
          <style>
           @page {
          margin-top: 20mm;
          margin-right: 15mm;
          margin-bottom: 20mm;
          margin-left: 15mm;
        }
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .footer { text-align: center; margin-top: 20px; }
            .logo { height: 70px; margin-top: 5px;  }
            .title { font-size: 24px; font-weight: bold; color: #2e7d32; margin-bottom: 5px; }
            .bottomLogo { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
            .subtitle { font-size: 14px; color: #666; margin-bottom: 15px; }
            .footerTitle { font-size: 16px; margin-bottom: 2px; }
            .date { font-size: 14px; margin-bottom: 20px; }
            .section { margin-bottom: 20px; }
            .section-title { 
              font-size: 16px; 
              font-weight: bold; 
              color: #2e7d32; 
              margin-bottom: 10px; 
              border-bottom: 1px solid #ddd; 
              padding-bottom: 5px; 
            }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            th { background-color: #e8f5e9; text-align: left; padding: 8px; font-weight: bold; }
            td { padding: 8px; border-bottom: 1px solid #ddd; }
            .summary-row { display: flex; margin-bottom: 8px; }
            .summary-label { width: 150px; font-weight: bold; }
            .summary-value { flex: 1; }
            .total { font-weight: bold; }
            .sale-header { 
              background-color: #f5f5f5; 
              padding: 8px; 
              margin-bottom: 5px; 
              border-radius: 4px;
            }
            .service-row { padding-left: 15px; }
            .sale-total {
              text-align: right; 
              margin-bottom: 15px;
              padding: 5px;
              background-color: #f9f9f9;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            
            <div class="title">Daily Report</div>
            <div class="subtitle">Complete sales and service details</div>
            <div class="date">Date: ${formattedDate}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Summary</div>
            
            <div class="section-title" style="margin-top: 15px; margin-bottom: 5px;">Staff Performance</div>
            <table>
              <thead>
                <tr>
                  <th>Staff Name</th>
                  <th>Services</th>
                  <th>Earnings (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${staffSummary
                  .map(
                    (staff) => `
                  <tr>
                    <td>${staff.userName}</td>
                    <td>${staff.services}</td>
                    <td>₹${staff.netAmount}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
            
            <div class="section-title" style="margin-top: 15px; margin-bottom: 5px;">Payment Summary</div>
            <div class="summary-row">
              <div class="summary-label">Total Services:</div>
              <div class="summary-value">${paymentSummary.services}</div>
            </div>
            <div class="summary-row">
              <div class="summary-label">Total Amount:</div>
              <div class="summary-value">₹${paymentSummary.amount}</div>
            </div>
            <div class="summary-row">
              <div class="summary-label">Total Discount:</div>
              <div class="summary-value">₹${paymentSummary.discount}</div>
            </div>
            <div class="summary-row total">
              <div class="summary-label">Net Amount:</div>
              <div class="summary-value">₹${paymentSummary.netAmount}</div>
            </div>
            
            <div class="section-title" style="margin-top: 15px; margin-bottom: 5px;">Payment Methods</div>
            <div class="summary-row">
              <div class="summary-label">Cash:</div>
              <div class="summary-value">₹${paymentSummary.Cash}</div>
            </div>
            <div class="summary-row">
              <div class="summary-label">UPI:</div>
              <div class="summary-value">₹${paymentSummary.UPI}</div>
            </div>
            <div class="summary-row">
              <div class="summary-label">Card:</div>
              <div class="summary-value">₹${paymentSummary.Card}</div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Sales Details</div>
            ${sales
              .map(
                (sale) => `
              <div class="sale">
                <div class="sale-header">
                  <strong>Bill No:</strong> ${sale.saleNum} | 
                  <strong>Customer:</strong> ${sale.billName || 'N/A'} | 
                  <strong>Contact:</strong> ${sale.billContact || 'N/A'} | 
                  <strong>Payment:</strong> ${getPaymentType(sale.paymentType)} | 
                  <strong>Entered By:</strong> ${sale.enteredByName}
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Rate</th>
                      <th>Additional</th>
                      <th>Net Amount</th>
                      <th>Performed By</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${sale.details
                      .map(
                        (detail) => `
                      <tr class="service-row">
                        <td>${detail.serviceName}</td>
                        <td>₹${detail.serviceRate}</td>
                        <td>₹${detail.serviceAdditionalCharge}</td>
                        <td>₹${detail.serviceNetAmount}</td>
                        <td>${detail.performedByName}</td>
                      </tr>
                    `
                      )
                      .join('')}
                  </tbody>
                </table>
                <div class="sale-total">
                  <strong>Subtotal:</strong> ₹${sale.totalAmount} | 
                  <strong>Additional:</strong> ₹${sale.additionalCharge} | 
                  <strong>Discount:</strong> ₹${sale.discount} | 
                  <strong>Net Amount:</strong> ₹${sale.netAmount}
                </div>
              </div>
            `
              )
              .join('')}
          </div>

          <div class="footer">
          <div class="footerTitle">Generated By:</div>
            <div class="bottomLogo">Salonmate</div>
          </div>
        </body>
      </html>
    `;

      // Generate and share PDF
      const { uri } = await printToFileAsync({ html });

      const newUri = `${FileSystem.cacheDirectory}service_report_${formattedDate}.pdf`;

      await FileSystem.moveAsync({
        from: uri,
        to: newUri,
      });

      await Sharing.shareAsync(newUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Sales Report',
      });
    } catch (error) {
      console.error('Error exporting to PDF:', error);
    } finally {
      setExporting(null);
    }
  };

  const ExportingModal = () => (
    <Modal transparent visible={!!exporting}>
      <View className="flex-1 items-center justify-center bg-black/50">
        <View className="m-4 w-4/5 rounded-lg bg-white p-6">
          <ActivityIndicator size="large" color="#2e7d32" />
          <Text className="mt-4 text-center text-lg font-medium text-gray-800">
            Generating {exporting === 'excel' ? 'Excel' : 'PDF'} report...
          </Text>
          <Text className="mt-2 text-center text-gray-600">
            Please wait while we prepare your report
          </Text>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text className="mt-4 text-lg text-gray-700">Loading report data...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white px-5 py-6">
      {/* Header */}
      <Text className="mb-2 text-2xl font-extrabold text-green-800">Daily Report</Text>
      <Text className="mb-4 text-gray-500">Staff performance summary</Text>
      <ScrollView className='pb-10' showsVerticalScrollIndicator={false}>
      {/* Date Selector */}
      <View className="mb-4 flex-row items-center justify-between">
        <TouchableOpacity
          className="flex-row items-center rounded-lg bg-green-100 px-4 py-3 shadow-md"
          onPress={() => setCalendarVisible(true)}>
          <Ionicons name="calendar" size={20} color="#2e7d32" />
          <Text className="ml-2 font-medium text-green-800">{formattedDate}</Text>
        </TouchableOpacity>

        {calendarVisible && (
          <DateTimePicker
            value={new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}

        {/* Export Buttons */}
        <View className="flex-row">
          <TouchableOpacity
            className="mr-2 flex-row items-center rounded-lg bg-green-700 px-4 py-3 shadow-md"
            onPress={exportToExcel}
            disabled={!paymentSummary || !!exporting}>
            <FontAwesome6 name="file-excel" size={18} color="white" />
            <Text className="ml-2 font-medium text-white">Excel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center rounded-lg bg-green-700 px-4 py-3 shadow-md"
            onPress={exportToPDF}
            disabled={!paymentSummary || !!exporting}>
            <AntDesign name="pdffile1" size={18} color="white" />
            <Text className="ml-2 font-medium text-white">PDF</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Staff Performance Table */}
      <View className="mb-6">
        {staffSummary.length > 0 ? (
          <View className="overflow-hidden rounded-lg border border-gray-200 shadow-md">
            {/* Table Header */}
            <View className="flex-row bg-green-100 px-4 py-3">
              <Text className="flex-1 font-bold text-green-800">Staff Name</Text>
              <Text className="w-24 text-center font-bold text-green-800">Services</Text>
              <Text className="w-24 text-center font-bold text-green-800">Earnings</Text>
            </View>

            {/* Table Rows */}
            {staffSummary.map((staff, index) => (
              <View
                key={staff.userId}
                className={`flex-row px-4 py-3 ${index % 2 === 0 ? 'bg-white' : 'bg-green-50'}`}>
                <Text className="flex-1 text-gray-800">{staff.userName}</Text>
                <Text className="w-24 text-center text-gray-800">{staff.services}</Text>
                <Text className="w-24 text-center text-gray-800">₹{staff.netAmount}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View className="rounded-lg bg-yellow-50 p-4">
            <Text className="text-center text-gray-700">
              No staff performance data available for this date
            </Text>
          </View>
        )}
      </View>

      {/* Summary Section */}
      {paymentSummary && (
        <>
          <View className="mb-4 rounded-lg bg-green-50 p-4 shadow-md">
            <Text className="mb-3 text-lg font-bold text-green-800">
              <Ionicons name="stats-chart" size={20} color="#2e7d32" /> Summary
            </Text>

            <View className="mb-2 flex-row justify-between">
              <Text className="text-gray-700">Total Services:</Text>
              <Text className="font-bold text-green-800">{paymentSummary.services}</Text>
            </View>

            <View className="mb-2 flex-row justify-between">
              <Text className="text-gray-700">Total Amount:</Text>
              <Text className="font-bold text-green-800">₹{paymentSummary.amount}</Text>
            </View>

            <View className="mb-2 flex-row justify-between">
              <Text className="text-gray-700">Total Discount:</Text>
              <Text className="font-bold text-green-800">₹{paymentSummary.discount}</Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-700">Net Amount:</Text>
              <Text className="font-bold text-green-800">₹{paymentSummary.netAmount}</Text>
            </View>
          </View>

          {/* Payment Methods Section */}
          <View className="rounded-lg bg-green-50 p-4 shadow-md">
            <Text className="mb-3 text-lg font-bold text-green-800">
              <MaterialCommunityIcons name="cash-multiple" size={20} color="#2e7d32" /> Payment
              Methods
            </Text>

            <View className="mb-2 flex-row justify-between">
              <Text className="text-gray-700">Cash:</Text>
              <Text className="font-bold text-green-800">₹{paymentSummary.Cash}</Text>
            </View>

            <View className="mb-2 flex-row justify-between">
              <Text className="text-gray-700">UPI:</Text>
              <Text className="font-bold text-green-800">₹{paymentSummary.UPI}</Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-700">Card:</Text>
              <Text className="font-bold text-green-800">₹{paymentSummary.Card}</Text>
            </View>
          </View>
        </>
      )}
      </ScrollView>

      {!paymentSummary && staffSummary.length === 0 && (
        <View className="rounded-lg bg-yellow-50 p-4">
          <Text className="text-center text-gray-700">No report data available for this date</Text>
        </View>
      )}
      <ExportingModal />
    </View>
  );
};

export default DailyReportScreen;
