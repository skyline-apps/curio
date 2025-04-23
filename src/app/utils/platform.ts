import { Capacitor } from "@capacitor/core";

export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};
