import React, { createContext } from "react";

export enum EventType {
  SAVE_SUCCESS = "CURIO_SAVE_SUCCESS",
  SAVE_ERROR = "CURIO_SAVE_ERROR",
  EXTENSION_INSTALLED = "CURIO_EXTENSION_INSTALLED",
}

interface BrowserMessageContextType {
  addMessageListener: (callback: (event: MessageEvent) => void) => void;
  removeMessageListener: (callback: (event: MessageEvent) => void) => void;
  checkExtensionInstalled: () => void;
  saveItemContent: (url: string, overrideOpenUrl?: string) => Promise<void>;
  savingItem: string | null;
  savingError: React.ReactElement | null;
  clearSavingError: () => void;
}

export const BrowserMessageContext = createContext<BrowserMessageContextType>({
  addMessageListener: () => {},
  removeMessageListener: () => {},
  checkExtensionInstalled: () => {},
  saveItemContent: () => Promise.resolve(),
  savingItem: null,
  savingError: null,
  clearSavingError: () => {},
});
