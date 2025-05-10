import Button from "@app/components/ui/Button";
import { useCache } from "@app/providers/Cache";
import { CurrentItemContext } from "@app/providers/CurrentItem";
import { ItemsContext } from "@app/providers/Items";
import { useToast } from "@app/providers/Toast";
import { UploadStatus } from "@app/schemas/types";
import config from "@app/utils/config.json";
import { createLogger } from "@app/utils/logger";
import { isNativePlatform } from "@app/utils/platform";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";

import { BrowserMessageContext, EventType } from ".";

const log = createLogger("browser-message-provider");

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

const isMobileBrowser = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    userAgent,
  );
};

interface BrowserMessageProviderProps {
  children: React.ReactNode;
}

const INSTALLED_TIMEOUT_MS = 1000;
const SAVE_TIMEOUT_MS = 10000;

const UNSUPPORTED_BROWSER_ERROR = (
  <>
    It looks like you&rsquo;re using an unsupported browser. Please try Chrome
    or Firefox.
  </>
);

export const BrowserMessageProvider: React.FC<BrowserMessageProviderProps> = ({
  children,
}: BrowserMessageProviderProps) => {
  const browser = getBrowserType();
  const { invalidateCache } = useCache();
  const [savingItem, setSavingItem] = useState<string | null>(null);
  const [savingError, setSavingError] = useState<React.ReactElement | null>(
    null,
  );
  const { fetchItems } = useContext(ItemsContext);
  const { fetchContent, loadedItem } = useContext(CurrentItemContext);
  const { showToast } = useToast();
  const listeners = useMemo(() => new Set<(event: MessageEvent) => void>(), []);
  const installationCallback = useRef<((success: boolean) => void) | null>(
    null,
  );

  const getExtensionName = useCallback((): string => {
    if (browser === "chrome") {
      return "Chrome extension";
    } else if (browser === "firefox") {
      return "Firefox add-on";
    }
    return "browser extension";
  }, [browser]);

  const getExtensionLink = useCallback((): React.ReactElement | null => {
    if (browser === "chrome") {
      return (
        <Link
          className="underline"
          target="_blank"
          to={config.chromeExtensionLink}
        >
          Chrome extension
        </Link>
      );
    } else if (browser === "firefox") {
      return (
        <Link
          className="underline"
          target="_blank"
          to={config.firefoxExtensionLink}
        >
          Firefox add-on
        </Link>
      );
    }
    return null;
  }, [browser]);

  const clearSavingError = useCallback(() => {
    setSavingError(null);
  }, []);

  const checkSavingAvailable = useCallback((): void => {
    const callback = (success: boolean): void => {
      if (isNativePlatform()) {
        setSavingError(null);
        return;
      }
      if (isMobileBrowser()) {
        setSavingError(
          <>
            <p>
              Saving directly from mobile browsers is not currently supported.
            </p>
            <p>
              Please save items using the Curio app or your desktop browser.
            </p>
          </>,
        );
        return;
      }
      if (success) {
        setSavingError(null);
      } else {
        setSavingError(
          <>
            <p>
              Curio requires a {getExtensionName()} to save pages from your
              browser.
            </p>
            {getExtensionLink() ? (
              <p>
                Please install and enable the {getExtensionLink()}, then refresh
                this page.
              </p>
            ) : (
              <p>{UNSUPPORTED_BROWSER_ERROR}</p>
            )}
          </>,
        );
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
  }, [getExtensionName, getExtensionLink]);

  const saveItemContent = useCallback(
    async (url: string, overrideOpenUrl?: string): Promise<void> => {
      try {
        setSavingItem(url);
        setSavingError(null);

        const timeoutId = setTimeout(() => {
          setSavingItem(null);
          const error = (
            <>
              {getExtensionLink() ? (
                <>
                  If your browser hasn&rsquo;t opened the link in a new tab,
                  please ensure the {getExtensionLink()} is installed and
                  enabled, then refresh this page.
                </>
              ) : (
                UNSUPPORTED_BROWSER_ERROR
              )}
            </>
          );
          showToast(error, {
            dismissable: true,
            disappearing: true,
            duration: 5000,
          });
          setSavingError(error);
        }, SAVE_TIMEOUT_MS);

        const currentTimeoutId = timeoutId;

        const allowedOrigins = new Set<string>();
        if (import.meta.env.VITE_CURIO_URL) {
          allowedOrigins.add(import.meta.env.VITE_CURIO_URL);
        }

        for (const origin of allowedOrigins) {
          window.postMessage(
            {
              type: "CURIO_SAVE_REQUEST",
              url,
              overrideOpenUrl,
              timeoutId: currentTimeoutId,
            },
            origin,
          );
        }
      } catch (error) {
        log.error("Error sending save request:", error);
        const errorElement = (
          <>
            <p>Failed to communicate with {getExtensionName()}.</p>
            {getExtensionLink() ? (
              <p>
                Please ensure the {getExtensionLink()} is installed and enabled,
                then refresh this page.
              </p>
            ) : (
              UNSUPPORTED_BROWSER_ERROR
            )}
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
    [showToast, getExtensionName, getExtensionLink],
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
            <p>
              Error saving content. Refresh the page and try again, and contact
              us if this problem persists.
            </p>
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
          <p>
            Error saving content. Refresh the page and try again, and contact us
            if this problem persists.
          </p>
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
        checkSavingAvailable,
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
