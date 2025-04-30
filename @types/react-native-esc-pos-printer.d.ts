declare module 'react-native-esc-pos-printer' {
  export interface TPrinter {
      device_name: string;
      inner_mac_address: string;
  }

  export default class EscPosPrinter {
      static scanDevices(): Promise<TPrinter[]>;
      static init(options: {
          target: string;
          seriesName?: string;
          language?: string;
      }): Promise<void>;
      static printImage(options: {
          base64: string;
          width: number;
          threshold?: number;
      }): Promise<void>;
  }
}
