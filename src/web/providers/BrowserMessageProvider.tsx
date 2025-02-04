"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { UploadStatus } from "@/app/api/v1/items/content/validation";
import Button from "@/components/ui/Button";
import { useToast } from "@/providers/ToastProvider";
import { createLogger } from "@/utils/logger";

import { ItemsContext } from "./ItemsProvider";

const log = createLogger("browser-message-provider");

interface BrowserMessageContextType {
  addMessageListener: (callback: (event: MessageEvent) => void) => void;
  removeMessageListener: (callback: (event: MessageEvent) => void) => void;
  saveItemContent: (url: string) => Promise<void>;
  savingItem: boolean;
  savingError: string | null;
}

export const BrowserMessageContext = createContext<BrowserMessageContextType>({
  addMessageListener: () => {},
  removeMessageListener: () => {},
  saveItemContent: () => Promise.resolve(),
  savingItem: false,
  savingError: null,
});

interface BrowserMessageProviderProps {
  children: React.ReactNode;
}

const SAVE_TIMEOUT_MS = 10000;

export const BrowserMessageProvider: React.FC<BrowserMessageProviderProps> = ({
  children,
}: BrowserMessageProviderProps) => {
  const [savingItem, setSavingItem] = useState<boolean>(false);
  const [savingError, setSavingError] = useState<string | null>(null);
  const { fetchItems } = useContext(ItemsContext);
  const { showToast } = useToast();
  const listeners = new Set<(event: MessageEvent) => void>();

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
      if (
        (event.data.type === "CURIO_SAVE_SUCCESS" ||
          event.data.type === "CURIO_SAVE_ERROR") &&
        event.data.timeoutId
      ) {
        clearTimeout(event.data.timeoutId);
      }

      if (event.data.type === "CURIO_SAVE_SUCCESS") {
        setSavingItem(false);
        if (!event.data.data || event.data.data.status === UploadStatus.ERROR) {
          log.error("Error updating content", event.data);
          setSavingError(
            "Error saving content. Contact us if this error persists.",
          );
          return;
        }
        fetchItems({}, true);
        // TODO: refresh items content if selected
        log.info("Content saved successfully", event.data);
        showToast(
          <div className="flex gap-2 items-center">
            Item successfully saved!
            <Button size="sm" href={`/items/${event.data.data.slug}`}>
              View
            </Button>
          </div>,
          { dismissable: true, disappearing: false },
        );
        // TODO: close modal
      } else if (event.data.type === "CURIO_SAVE_ERROR") {
        setSavingItem(false);
        log.error("Error saving content", event.data);
        setSavingError(
          "Error saving content. Contact us if this error persists.",
        );
      }

      listeners.forEach((listener) => listener(event));
    },
    [showToast, listeners],
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  const addMessageListener = useCallback(
    (callback: (event: MessageEvent) => void) => {
      listeners.add(callback);
    },
    [],
  );

  const removeMessageListener = useCallback(
    (callback: (event: MessageEvent) => void) => {
      listeners.delete(callback);
    },
    [],
  );

  return (
    <BrowserMessageContext.Provider
      value={{
        addMessageListener,
        removeMessageListener,
        saveItemContent,
        savingItem,
        savingError,
      }}
    >
      {children}
    </BrowserMessageContext.Provider>
  );
};
