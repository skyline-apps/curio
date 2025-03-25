"use client";
import Button from "@web/components/ui/Button";
import config from "@web/lib/config.json";
import { UploadStatus } from "@web/lib/storage/types";
import { useToast } from "@web/providers/ToastProvider";
import { createLogger } from "@web/utils/logger";
import Link from "next/link";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useCache } from "./CacheProvider";
import { CurrentItemContext } from "./CurrentItemProvider";
import { ItemsContext } from "./ItemsProvider";

const log = createLogger("browser-message-provider");

export enum EventType {
  SAVE_SUCCESS = "CURIO_SAVE_SUCCESS",
  SAVE_ERROR = "CURIO_SAVE_ERROR",
  EXTENSION_INSTALLED = "CURIO_EXTENSION_INSTALLED",
}

type BrowserType = "chrome" | "firefox" | "other";

const getBrowserType = (): BrowserType => {
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

interface BrowserMessageContextType {
  addMessageListener: (callback: (event: MessageEvent) => void) => void;
  removeMessageListener: (callback: (event: MessageEvent) => void) => void;
  checkExtensionInstalled: () => void;
  saveItemContent: (url: string) => Promise<void>;
  savingItem: string | null;
  savingError: JSX.Element | null;
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

interface BrowserMessageProviderProps {
  children: React.ReactNode;
}

const INSTALLED_TIMEOUT_MS = 1000;
const SAVE_TIMEOUT_MS = 10000;

export const BrowserMessageProvider: React.FC<BrowserMessageProviderProps> = ({
  children,
}: BrowserMessageProviderProps) => {
  const browser = getBrowserType();
  const { invalidateCache } = useCache();
  const [savingItem, setSavingItem] = useState<string | null>(null);
  const [savingError, setSavingError] = useState<JSX.Element | null>(null);
  const { fetchItems } = useContext(ItemsContext);
  const { fetchContent, loadedItem } = useContext(CurrentItemContext);
  const { showToast } = useToast();
  const listeners = useMemo(() => new Set<(event: MessageEvent) => void>(), []);
  const installationCallback = useRef<((success: boolean) => void) | null>(
    null,
  );

  const getExtensionError = useCallback((): JSX.Element => {
    if (browser === "chrome") {
      return (
        <span>
          Please ensure the{" "}
          <Link
            className="underline"
            target="_blank"
            href={config.chromeExtensionLink}
          >
            Chrome extension
          </Link>{" "}
          is installed and enabled.
        </span>
      );
    } else if (browser === "firefox") {
      return (
        <span>
          Please ensure the{" "}
          <Link
            className="underline"
            target="_blank"
            href={config.firefoxExtensionLink}
          >
            Firefox extension
          </Link>{" "}
          is installed and enabled.
        </span>
      );
    }
    return (
      <span>
        It looks like you&rsquo;re using an unsupported browser. Please try
        Chrome or Firefox.
      </span>
    );
  }, [browser]);

  const clearSavingError = useCallback(() => {
    setSavingError(null);
  }, []);

  const checkExtensionInstalled = useCallback((): void => {
    const callback = (success: boolean): void => {
      if (success) {
        setSavingError(null);
      } else {
        setSavingError(<span>Unable to connect. {getExtensionError()}</span>);
      }
    };
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
  }, [getExtensionError]);

  const saveItemContent = useCallback(
    async (url: string): Promise<void> => {
      try {
        setSavingItem(url);
        setSavingError(null);

        const timeoutId = setTimeout(() => {
          setSavingItem(null);
          const error = <>Operation timed out. {getExtensionError()}</>;
          showToast(error, {
            dismissable: true,
            disappearing: true,
            duration: 5000,
          });
          setSavingError(error);
        }, SAVE_TIMEOUT_MS);

        const currentTimeoutId = timeoutId;

        const allowedOrigins = new Set<string>();
        if (process.env.NEXT_PUBLIC_CURIO_URL) {
          allowedOrigins.add(process.env.NEXT_PUBLIC_CURIO_URL);
        }
        if (process.env.VERCEL_URL) {
          allowedOrigins.add(process.env.VERCEL_URL);
        }

        for (const origin of allowedOrigins) {
          window.postMessage(
            {
              type: "CURIO_SAVE_REQUEST",
              url,
              timeoutId: currentTimeoutId,
            },
            origin,
          );
        }
      } catch (error) {
        log.error("Error sending save request:", error);
        const errorElement = (
          <>
            Failed to communicate with browser extension. {getExtensionError()}
          </>
        );
        showToast(errorElement, {
          dismissable: true,
          disappearing: true,
          duration: 5000,
        });
        setSavingError(errorElement);
      }
    },
    [showToast, getExtensionError],
  );

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
        setSavingItem(null);
        if (!event.data.data || event.data.data.status === UploadStatus.ERROR) {
          log.error("Error updating content", event.data);
          const errorElement = (
            <span>
              Error saving content. Contact us if this error persists.
            </span>
          );
          showToast(errorElement, {
            dismissable: true,
            disappearing: true,
            duration: 5000,
          });
          setSavingError(errorElement);
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
            <Button size="sm" href={`/item/${event.data.data.slug}`}>
              View
            </Button>
          </div>,
          { dismissable: true, disappearing: true, duration: 5000 },
        );
        listeners.forEach((listener) => listener(event));
        log.info("Content saved successfully", event.data);
      } else if (event.data.type === EventType.SAVE_ERROR) {
        setSavingItem(null);
        log.error("Error saving content", event.data);
        const errorElement = (
          <span>Error saving content. Contact us if this error persists.</span>
        );
        showToast(errorElement, {
          dismissable: true,
          disappearing: true,
          duration: 5000,
        });
        setSavingError(errorElement);
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
