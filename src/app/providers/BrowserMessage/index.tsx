import React, { createContext } from "react";

export enum EventType {
  SAVE_SUCCESS = "CURIO_SAVE_SUCCESS",
  SAVE_ERROR = "CURIO_SAVE_ERROR",
  EXTENSION_INSTALLED = "CURIO_EXTENSION_INSTALLED",
}

interface BrowserMessageContextType {
  getExtensionLink: () => React.ReactElement | null;
  addMessageListener: (callback: (type: EventType) => void) => void;
  removeMessageListener: (callback: (type: EventType) => void) => void;
  checkSavingAvailable: () => void;
  saveItemContent: (url: string, overrideOpenUrl?: string) => Promise<void>;
  savingItem: string | null;
  savingError: React.ReactElement | null;
  clearSavingError: () => void;
}

export const BrowserMessageContext = createContext<BrowserMessageContextType>({
  getExtensionLink: () => null,
  addMessageListener: () => {},
  removeMessageListener: () => {},
  checkSavingAvailable: () => {},
  saveItemContent: () => Promise.resolve(),
  savingItem: null,
  savingError: null,
  clearSavingError: () => {},
});
