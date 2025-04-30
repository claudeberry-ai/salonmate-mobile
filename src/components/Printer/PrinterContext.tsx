import { createContext, useState, useContext, ReactNode } from 'react';
import { Device } from 'react-native-ble-plx';

// Define the context type
interface PrinterContextType {
  printer: Device | null;
  setPrinter: (device: Device | null) => void;
}

// Create the context
const PrinterContext = createContext<PrinterContextType | undefined>(undefined);

// Provider component
export const PrinterProvider = ({ children }: { children: ReactNode }) => {
  const [printer, setPrinter] = useState<Device | null>(null);

  return (
    <PrinterContext.Provider value={{ printer, setPrinter }}>{children}</PrinterContext.Provider>
  );
};

// Custom hook for using the context
export const usePrinter = () => {
  const context = useContext(PrinterContext);
  if (!context) {
    throw new Error('usePrinter must be used within a PrinterProvider');
  }
  return context;
};
