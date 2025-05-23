import { Capacitor } from "@capacitor/core";

export type BrowserType = "chrome" | "firefox" | "other";

export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

export const getBrowserType = (): BrowserType => {
  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.indexOf("firefox") > -1) {
    return "firefox";
  }
  // Chrome detection using user agent and vendor
  if (userAgent.indexOf("chrome") > -1 && navigator.vendor === "Google Inc.") {
    return "chrome";
  }
  return "other";
};

export const isMobileBrowser = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    userAgent,
  );
};
