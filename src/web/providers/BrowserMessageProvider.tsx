"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { UploadStatus } from "@/app/api/v1/items/content/validation";
import Button from "@/components/ui/Button";
import { useToast } from "@/providers/ToastProvider";
import { createLogger } from "@/utils/logger";

import { useCache } from "./CacheProvider";
import { CurrentItemContext } from "./CurrentItemProvider";
import { ItemsContext } from "./ItemsProvider";

const log = createLogger("browser-message-provider");

export enum EventType {
  SAVE_SUCCESS = "CURIO_SAVE_SUCCESS",
  SAVE_ERROR = "CURIO_SAVE_ERROR",
  EXTENSION_INSTALLED = "CURIO_EXTENSION_INSTALLED",
}

interface BrowserMessageContextType {
  addMessageListener: (callback: (event: MessageEvent) => void) => void;
  removeMessageListener: (callback: (event: MessageEvent) => void) => void;
  checkExtensionInstalled: (callback: (success: boolean) => void) => void;
  saveItemContent: (url: string) => Promise<void>;
  savingItem: boolean;
  savingError: string | null;
  clearSavingError: () => void;
}

export const BrowserMessageContext = createContext<BrowserMessageContextType>({
  addMessageListener: () => {},
  removeMessageListener: () => {},
  checkExtensionInstalled: () => {},
  saveItemContent: () => Promise.resolve(),
  savingItem: false,
  savingError: null,
  clearSavingError: () => {},
});

interface BrowserMessageProviderProps {
  children: React.ReactNode;
}

const INSTALLED_TIMEOUT_MS = 1000;
const SAVE_TIMEOUT_MS = 10000;

export const BrowserMessageProvider: React.FC<BrowserMessageProviderProps> = ({
  children,
}: BrowserMessageProviderProps) => {
  const { invalidateCache } = useCache();
  const [savingItem, setSavingItem] = useState<boolean>(false);
  const [savingError, setSavingError] = useState<string | null>(null);
  const { fetchItems } = useContext(ItemsContext);
  const { fetchContent, loadedItem } = useContext(CurrentItemContext);
  const { showToast } = useToast();
  const listeners = useMemo(() => new Set<(event: MessageEvent) => void>(), []);
  const installationCallback = useRef<((success: boolean) => void) | null>(
    null,
  );

  const clearSavingError = useCallback(() => {
    setSavingError(null);
  }, []);

  const checkExtensionInstalled = useCallback(
    (callback: (success: boolean) => void): void => {
      installationCallback.current = callback;
      const timeoutId = setTimeout(() => {
        callback(false);
      }, INSTALLED_TIMEOUT_MS);
      try {
        window.postMessage(
          { type: "CURIO_CHECK_EXTENSION_INSTALLED", timeoutId: timeoutId },
          "*",
        );
      } catch {
        callback(false);
      }
    },
    [],
  );

  const saveItemContent = useCallback(async (url: string): Promise<void> => {
    try {
      setSavingItem(true);
      setSavingError(null);

      const timeoutId = setTimeout(() => {
        setSavingItem(false);
        setSavingError(
          "Request timed out. Please try again or check that the Curio extension is installed and enabled.",
        );
      }, SAVE_TIMEOUT_MS);

      const currentTimeoutId = timeoutId;

      window.postMessage(
        {
          type: "CURIO_SAVE_REQUEST",
          url,
          timeoutId: currentTimeoutId,
        },
        "http://localhost:3000",
      );
    } catch (error) {
      log.error("Error sending save request:", error);
      setSavingError(
        "Failed to communicate with Chrome extension. Please ensure the extension is properly installed and enabled.",
      );
    }
  }, []);

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      if (event.data.type === EventType.EXTENSION_INSTALLED) {
        clearTimeout(event.data.timeoutId);
        installationCallback.current?.(event.data.data.success);
        return;
      } else if (
        (event.data.type === EventType.SAVE_SUCCESS ||
          event.data.type === EventType.SAVE_ERROR) &&
        event.data.timeoutId
      ) {
        clearTimeout(event.data.timeoutId);
      }

      if (event.data.type === EventType.SAVE_SUCCESS) {
        setSavingItem(false);
        if (!event.data.data || event.data.data.status === UploadStatus.ERROR) {
          log.error("Error updating content", event.data);
          setSavingError(
            "Error saving content. Contact us if this error persists.",
          );
          return;
        }
        fetchItems(true);
        if (loadedItem?.item.slug === event.data.data.slug) {
          fetchContent(event.data.data.slug, true);
        } else {
          invalidateCache(event.data.data.slug);
        }
        showToast(
          <div className="flex gap-2 items-center">
            Item successfully saved!
            <Button size="sm" href={`/items/${event.data.data.slug}`}>
              View
            </Button>
          </div>,
          { dismissable: true, disappearing: true, duration: 5000 },
        );
        listeners.forEach((listener) => listener(event));
        log.info("Content saved successfully", event.data);
      } else if (event.data.type === EventType.SAVE_ERROR) {
        setSavingItem(false);
        log.error("Error saving content", event.data);
        setSavingError(
          "Error saving content. Contact us if this error persists.",
        );
        listeners.forEach((listener) => listener(event));
      }
    },
    [
      showToast,
      fetchItems,
      listeners,
      fetchContent,
      loadedItem,
      invalidateCache,
    ],
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  const addMessageListener = useCallback(
    (callback: (event: MessageEvent) => void) => {
      listeners.add(callback);
    },
    [listeners],
  );

  const removeMessageListener = useCallback(
    (callback: (event: MessageEvent) => void) => {
      listeners.delete(callback);
    },
    [listeners],
  );

  return (
    <BrowserMessageContext.Provider
      value={{
        addMessageListener,
        removeMessageListener,
        checkExtensionInstalled,
        saveItemContent,
        savingItem,
        savingError,
        clearSavingError,
      }}
    >
      {children}
    </BrowserMessageContext.Provider>
  );
};
