declare module "png-js" {
    export default class PNG {
      constructor(data: Buffer);
      width: number;
      height: number;
      decode(callback: (pixels: Uint8Array) => void): void;
    }
  }
  