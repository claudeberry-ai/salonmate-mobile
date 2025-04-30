import * as ImageManipulator from 'expo-image-manipulator';
import ThermalPrinterModule from 'react-native-thermal-printer';
import { Alert, Permission, PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '~/constants/backend';

interface SalonDetails {
  salonName: string;
  salonAddr: string;
  salonCity: string;
  salonContact: string;
  logoUri?: string;
}

interface ServiceItem {
  name: string;
  rate: number;
  additionalCharge: number;
  quantity?: number;
}

interface SaleData {
  invoiceNumber: string;
  billName?: string;
  date1: string;
  time: string;
  paymentMethod: string;
  services: ServiceItem[];
  totalAdditionalCharges: number;
  discount: number;
}
interface GroupedServices {
  name: string;
  qty: number;
  rate: number;
  addCharge: number;
}

const getSalonDetails = async (): Promise<SalonDetails> => {
  try {
    const data = await AsyncStorage.getItem(Config.AsyncUserKey);
    const logo = await AsyncStorage.getItem(Config.logoAsyncKey);

    if (data) {
      const userData = JSON.parse(data);
      return {
        salonName: userData.salonName,
        salonAddr: userData.salonAddr,
        salonCity: userData.salonCity,
        salonContact: userData.salonContact,
        logoUri: logo || '',
      };
    }
  } catch (error) {
    console.error('Error retrieving salon details:', error);
  }
  return {
    salonName: 'My Salon',
    salonAddr: 'No Address Available',
    salonCity: '',
    salonContact: '',
  };
};

const centerAlign = (text: string, width: number = 32): string => {
  if (text.length >= width) return text;
  const padding = Math.floor((width - text.length) / 2);
  return ' '.repeat(padding) + text + ' '.repeat(width - text.length - padding);
};

const wrapText = (text: string, width: number): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach((word) => {
    if ((currentLine + ' ' + word).length <= width) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });

  if (currentLine) lines.push(currentLine);
  return lines;
};

const formatServiceLine = (service: GroupedServices): string[] => {
  const { name, rate, qty, addCharge = 0 } = service;
  const nameWithQty = `${name} x${qty}`;
  const total = rate * qty + addCharge;

  const nameLines = wrapText(nameWithQty, 14); // wrap to 22 characters

  const lines: string[] = [];

  // First line with all fields
  const firstLine =
    nameLines[0].padEnd(14, ' ') + // Name + qty
    rate.toFixed(0).padStart(5, ' ') +
    addCharge.toFixed(0).padStart(4, ' ') +
    total.toFixed(2).padStart(9, ' ');

  lines.push(firstLine);

  // Additional lines for wrapped name only
  for (let i = 1; i < nameLines.length; i++) {
    lines.push(nameLines[i]); // No additional fields
  }

  return lines;
};

const generateReceiptText = (
  salonDetails: SalonDetails,
  saleData: SaleData,
  groupedServices: GroupedServices[]
): string => {
  const ESC = '\x1B';
  const INIT = `${ESC}@`;
  const CENTER = `${ESC}a1`;
  const LEFT_ALIGN = `${ESC}a0`;
  const BOLD_ON = `${ESC}E1`;
  const BOLD_OFF = `${ESC}E0`;
  const NORMAL_TEXT = `${ESC}!\x00`;
  const LARGE_TEXT = `${ESC}!\x10`;
  let receipt = INIT;

  // Header
  receipt += `${BOLD_ON}${centerAlign(salonDetails.salonName, 32)}${BOLD_OFF}\n`;
  receipt += `${centerAlign(salonDetails.salonAddr, 32)}\n`;
  receipt += `${centerAlign(salonDetails.salonCity, 32)}\n`;
  if (salonDetails.salonContact) {
    receipt += `${centerAlign(`Phone: ${salonDetails.salonContact}`, 32)}\n`;
  }

  receipt += '--------------------------------\n';

  // Invoice info
  receipt += `${BOLD_ON}Invoice # ${saleData.invoiceNumber}${BOLD_OFF}\n`;
  receipt += '--------------------------------\n';

  if (saleData.billName) {
    receipt += `Name: ${saleData.billName}\n`;
  }
  receipt += `Date: ${saleData.date1} ${saleData.time}\n`;
  receipt += `Payment: ${saleData.paymentMethod}\n`;
  receipt += '--------------------------------\n';

  // Services header
  receipt += 'Service        Rate  Add.  Total\n'; // Updated header
  receipt += '--------------------------------\n';

  // Services
  groupedServices.forEach((service) => {
    formatServiceLine(service).forEach((line) => {
      receipt += `${line}\n`;
    });
  });

  receipt += '--------------------------------\n';

  // Calculations
  const subtotal = saleData.services.reduce((sum, service) => sum + service.rate, 0);
  const additionalCharges = saleData.totalAdditionalCharges || 0;
  const discount = saleData.discount || 0;
  const total = subtotal + additionalCharges - discount;

  receipt += `Subtotal:       ${(subtotal + additionalCharges).toFixed(2).padStart(16, ' ')}\n`;
  // receipt += `Add. Charges:   ${additionalCharges.toFixed(2).padStart(16, ' ')}\n`;

  if (discount > 0) {
    receipt += `Discount:       ${discount.toFixed(2).padStart(16, ' ')}\n`;
  }

  receipt += '================================\n';
  receipt += `${BOLD_ON}${centerAlign(`GRAND TOTAL: ${total.toFixed(2)}`, 32)}${BOLD_OFF}\n`;
  receipt += '================================\n';
  // receipt += LEFT_ALIGN; // Return to left alignment

  // Footer
  receipt += `${centerAlign('Thank You! Visit Again.', 32)}\n`;
  receipt += `${centerAlign('Powered By Salonmate', 32)}`;

  // Add cut command
  receipt += '\x1Bi'; // Full cut command

  return receipt;
};

const requestBluetoothPermissions = async () => {
  if (Platform.OS === 'android') {
    const sdkVersion = parseInt(Platform.constants?.Release || '0', 10);

    let permissions: Permission[] = [];
    if (sdkVersion >= 12) {
      permissions.push(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
      );
    } else {
      permissions.push(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADMIN,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
    }

    const granted = await PermissionsAndroid.requestMultiple(permissions);
    const allGranted = Object.values(granted).every(
      (res) => res === PermissionsAndroid.RESULTS.GRANTED
    );

    if (!allGranted) {
      throw new Error('Bluetooth permissions not granted');
    }
  }
};

export const printReceipt = async (saleData: any) => {
  try {
    // let targetPrinter;
    // const MainPrinter = await AsyncStorage.getItem(Config.MainPrinter);

    // const printers = await ThermalPrinterModule.getBluetoothDeviceList();

    // if (MainPrinter) {
    //   // Try to find the saved printer
    //   targetPrinter = printers.find(
    //     (p) => p.deviceName.includes(MainPrinter) || p.macAddress === MainPrinter
    //   );
    // }
    await requestBluetoothPermissions(); // 🔐 Ask before accessing Bluetooth

    const groupedServices: { name: string; rate: number; qty: number; addCharge: number }[] = [];
    saleData.services.forEach((service: any) => {
      const existing = groupedServices.find(
        (s) => s.name === service.name && s.rate === service.rate
      );

      console.log(service);

      if (existing) {
        existing.qty += 1;
        existing.addCharge += service.additionalCharge;
      } else {
        groupedServices.push({
          name: service.name,
          rate: service.rate,
          qty: 1,
          addCharge: service.additionalCharge,
        });
      }
    });

    const salonDetails = await getSalonDetails();
    let receiptText = generateReceiptText(salonDetails, saleData, groupedServices);

    let payload = '';

    // Add logo if available
    if (salonDetails.logoUri) {
      try {
        const resized = await ImageManipulator.manipulateAsync(
          salonDetails.logoUri,
          [{ resize: { width: 382 } }], // Adjust width based on your printer
          { base64: true, format: ImageManipulator.SaveFormat.JPEG }
        );

        payload += `<img>data:image/jpeg;base64,${resized.base64}</img>\n`;
      } catch (error) {
        console.error('Error processing logo:', error);
      }
    }

    // Add receipt text
    payload += `${receiptText}`;


    const printOptions: any = {
      payload,
      printerNbrCharactersPerLine: 32, // Standard 80mm paper
      printerDpi: 203, // Common thermal printer DPI
      printerWidthMM: 80, // Standard 80mm paper width
    };

    // // Only add macAddress if we have a target printer
    // if (targetPrinter) {
    //   printOptions.macAddress = targetPrinter.macAddress;
    // }

    // Print
    await ThermalPrinterModule.printBluetooth(printOptions);
  } catch (error) {
    console.error('Print Error:', error);
    Alert.alert('Error', 'Failed to print receipt.');
  }
};
