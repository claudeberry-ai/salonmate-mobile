import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  ActivityIndicator,
  Alert,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import { requestBluetoothPermissions } from './BluetoothPermission';
import { usePrinter } from '../../components/Printer/PrinterContext';
import { useNavigation } from '@react-navigation/native';
import { Platform } from 'react-native';
import Feather from '@expo/vector-icons/Feather';

const manager = new BleManager();

export default function PrinterList() {
  const navigation = useNavigation();
  const { printer: connectedPrinter, setPrinter } = usePrinter();
  const [scanning, setScanning] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Scanning for printers...');
  const [printers, setPrinters] = useState<Device[]>([]);

  useEffect(() => {
    checkBluetoothAndScan();

    // Add Bluetooth state subscription
    const bluetoothStateSubscription = manager.onStateChange((state) => {
      if (state === 'PoweredOff') {
        setStatusMessage('Bluetooth is off. Turn it on and retry.');
        setPrinters([]);
        setPrinter(null);
      } else if (state === 'PoweredOn') {
        checkBluetoothAndScan();
      }
    }, true);

    // Add device connection monitor
    // Only set up the disconnect subscription if we have a connected printer
    const deviceDisconnectSubscription = connectedPrinter
      ? manager.onDeviceDisconnected(connectedPrinter.id, (error, device) => {
          if (device && device.id === connectedPrinter.id) {
            setStatusMessage(`Disconnected from ${device.name}`);
            setPrinter(null);
          }
        })
      : null;

    // Then in the cleanup:
    return () => {
      bluetoothStateSubscription.remove();
      deviceDisconnectSubscription?.remove(); // Safe optional chaining
      manager.stopDeviceScan();
    };
  }, [connectedPrinter?.id]);

  const checkBluetoothAndScan = async () => {
    setStatusMessage('Checking Bluetooth...');

    if (Platform.OS === 'android') {
      const bluetoothState = await manager.state();
      if (bluetoothState !== 'PoweredOn') {
        Alert.alert('Bluetooth is Off', 'Please turn on Bluetooth to connect to a printer.', [
          { text: 'OK' },
        ]);
        setStatusMessage('Bluetooth is off. Turn it on and retry.');
        return;
      }
    }

    scanAndDiscoverPrinters();
  };

  const scanAndDiscoverPrinters = async () => {
    setScanning(true);
    setStatusMessage('Scanning for printers...');
    setPrinters([]);

    const hasPermissions = await requestBluetoothPermissions();
    if (!hasPermissions) {
      setStatusMessage('Bluetooth permissions denied.');
      setScanning(false);
      return;
    }

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('Scan error:', error);
        setStatusMessage('Scan failed.');
        setScanning(false);
        return;
      }

      if (
        device?.name &&
        (device.name.includes('MPT') ||
          device.name.includes('Printer') ||
          device.name.includes('PC201'))
      ) {
        setPrinters((prevPrinters) => {
          const exists = prevPrinters.some((p) => p.id === device.id);
          return exists ? prevPrinters : [...prevPrinters, device];
        });
      }
    });

    setTimeout(() => {
      manager.stopDeviceScan();
      setScanning(false);

      if (printers.length === 0) {
        setStatusMessage('No printers found. Try scanning again.');
      }
    }, 5000);
  };

  const connectToPrinter = async (device: Device) => {
    try {
      setStatusMessage(`Connecting to ${device.name}...`);

      const connectedDevice = await device.connect();
      await connectedDevice.discoverAllServicesAndCharacteristics();

      // Monitor connection state
      connectedDevice.onDisconnected((error, device) => {
        setStatusMessage(`Disconnected from ${device?.name}`);
        setPrinter(null);
      });

      setPrinter(connectedDevice);
      setStatusMessage(`Connected to ${device.name}`);
      navigation.goBack();
    } catch (error) {
      console.error('❌ Connection failed:', error);
      setStatusMessage('Connection failed. Try again.');
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' }}>
      {scanning && <ActivityIndicator size="large" color="blue" />}
      <Text style={{ fontSize: 18, marginVertical: 10 }}>{statusMessage}</Text>

      {/* Show current connection status */}
      {connectedPrinter && (
        <View
          style={{ padding: 10, marginBottom: 10, backgroundColor: '#e3f2fd', borderRadius: 5 }}>
          <Text style={{ fontSize: 16 }}>Currently connected to: {connectedPrinter.name}</Text>
        </View>
      )}

      {/* Printer List */}
      <FlatList
        data={printers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              padding: 15,
              marginVertical: 5,
              backgroundColor: '#ddd',
              borderRadius: 10,
              width: '100%',
              alignItems: 'center',
              flexDirection: 'row',
            }}
            onPress={() => connectToPrinter(item)}>
            <Feather name="printer" size={24} color="black" />
            <Text className="ml-3" style={{ fontSize: 16 }}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Rescan Button */}
      {!scanning && <Button title="Rescan" onPress={checkBluetoothAndScan} />}
    </View>
  );
}
