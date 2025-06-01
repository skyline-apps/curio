import Button from "@app/components/ui/Button";
import { useCache } from "@app/providers/Cache";
import { CurrentItemContext } from "@app/providers/CurrentItem";
import { ItemsContext } from "@app/providers/Items";
import { useToast } from "@app/providers/Toast";
import { UploadStatus } from "@app/schemas/types";
import { UpdateItemContentResponse } from "@app/schemas/v1/items/content";
import { authenticatedFetch, handleAPIResponse } from "@app/utils/api";
import config from "@app/utils/config.json";
import { createLogger } from "@app/utils/logger";
import {
  getBrowserType,
  isMobileBrowser,
  isNativePlatform,
} from "@app/utils/platform";
import { Toast } from "@capacitor/toast";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { SendIntent } from "send-intent";

import { BrowserMessageContext, EventType } from ".";
import { useInAppBrowserCapture } from "./useInAppBrowserCapture";

const log = createLogger("browser-message-provider");

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

const MOBILE_BROWSER_ERROR = (
  <>
    Saving directly from mobile browsers is not currently supported. Please save
    items using the Curio app or your desktop browser.
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
  const listeners = useMemo(() => new Set<(type: EventType) => void>(), []);
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

  const handleSaveResponse = useCallback(
    (response: UpdateItemContentResponse, isNative: boolean = false) => {
      setSavingItem(null);
      if (response.status === UploadStatus.ERROR) {
        log.error("Error updating content", response.error);
        const errorElement = (
          <p>
            Error saving content.{" "}
            {isNative ? "Try again," : "Refresh the page and try again,"} and
            contact us if this problem persists.
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
      if (loadedItem?.item.slug === response.slug) {
        fetchContent(response.slug, true);
      } else {
        invalidateCache(response.slug);
      }
      showToast(
        <div className="flex gap-2 items-center">
          Item successfully saved!
          <Button size="sm" href={`/item/${response.slug}`}>
            View
          </Button>
        </div>,
        { dismissable: true, disappearing: true, duration: 5000 },
      );
      log.info("Content saved successfully", response);
    },
    [showToast, fetchItems, fetchContent, loadedItem, invalidateCache],
  );

  const handleHtmlCaptured = useCallback(
    (htmlContent: string | null, urlToSave: string | null): void => {
      async function updateContent(
        htmlContent: string,
        url: string,
      ): Promise<void> {
        try {
          log.debug("Received HTML content:", htmlContent.length);
          const response = await authenticatedFetch("/api/v1/items/content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ htmlContent, url }),
          });

          const result =
            await handleAPIResponse<UpdateItemContentResponse>(response);

          handleSaveResponse(result);
          listeners.forEach((listener) => {
            listener(EventType.SAVE_SUCCESS);
          });
        } catch (e) {
          log.error("API request failed for saving content:", e);
          const errorElement = (
            <p>
              Failed to save content. Check your network connection and try
              again.
            </p>
          );
          showToast(errorElement, {
            dismissable: true,
            disappearing: true,
            duration: 5000,
          });
          setSavingError(errorElement);
          listeners.forEach((listener) => {
            listener(EventType.SAVE_ERROR);
          });
        } finally {
          setSavingItem(null);
        }
      }

      if (!htmlContent || !urlToSave) {
        log.error("HTML capture failed or original URL missing");
        setSavingItem(null);
        const errorElement = <p>Failed to capture page content.</p>;
        showToast(errorElement, {
          dismissable: true,
          disappearing: true,
          duration: 5000,
        });
        setSavingError(errorElement);
        listeners.forEach((listener) => {
          listener(EventType.SAVE_ERROR);
        });
        return;
      }

      updateContent(htmlContent, urlToSave);
    },
    [handleSaveResponse, showToast, listeners],
  );

  const { startCapture, isCapturing, captureError } = useInAppBrowserCapture({
    onHtmlCaptured: handleHtmlCaptured,
    onCaptureProcessClosed: () => {},
  });

  const checkSavingAvailable = useCallback((): void => {
    const callback = (success: boolean): void => {
      if (isNativePlatform()) {
        setSavingError(null);
        return;
      }
      if (isMobileBrowser()) {
        setSavingError(<p>{MOBILE_BROWSER_ERROR}</p>);
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
    async (url: string | null, overrideOpenUrl?: string) => {
      if (!url) {
        setSavingError(<p>Invalid URL</p>);
        return;
      }

      if (!isNativePlatform() && isMobileBrowser()) {
        setSavingError(<p>{MOBILE_BROWSER_ERROR}</p>);
        return;
      }

      if (isNativePlatform()) {
        setSavingItem(url);
        if (!isCapturing) {
          startCapture(overrideOpenUrl || url, url);
        }
        return;
      }

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
    [showToast, getExtensionName, getExtensionLink, isCapturing, startCapture],
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
        handleSaveResponse(event.data.data);
        listeners.forEach((listener) => listener(event.data.type));
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
        listeners.forEach((listener) => listener(event.data.type));
      }
    },
    [handleSaveResponse, showToast, listeners],
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  const addMessageListener = useCallback(
    (callback: (type: EventType) => void) => {
      listeners.add(callback);
    },
    [listeners],
  );

  const removeMessageListener = useCallback(
    (callback: (type: EventType) => void) => {
      listeners.delete(callback);
    },
    [listeners],
  );

  useEffect(() => {
    if (!isNativePlatform()) {
      return;
    }
    async function processShareIntent(): Promise<void> {
      let intentUrlProcessed = false;
      try {
        const result = await SendIntent.checkSendIntentReceived();
        if (result && result.url) {
          const resultUrl = decodeURIComponent(result.url);
          log.debug("Share intent URL received:", resultUrl);

          intentUrlProcessed = true;

          const toastListener = (type: EventType): void => {
            if (type === EventType.SAVE_SUCCESS) {
              Toast.show({
                text: "Link saved successfully",
              });
            } else if (type === EventType.SAVE_ERROR) {
              Toast.show({
                text: "Failed to save link",
              });
            }
            SendIntent.finish();
            listeners.delete(toastListener);
          };
          listeners.add(toastListener);

          await saveItemContent(resultUrl);
        }
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === "No processing needed") {
            return;
          }
          log.error("Error processing share intent:", error.message);
        } else {
          log.error("Unknown error processing share intent:", error);
        }
        if (intentUrlProcessed) {
          log.debug(
            "Finishing SendIntent due to error during share processing after URL was received.",
          );
          Toast.show({ text: "Failed to process shared link." });
          SendIntent.finish();
        }
      }
    }

    processShareIntent().catch((error) => {
      log.error("Unhandled error from processShareIntent invocation:", error);
      log.error(
        "Finishing SendIntent due to unhandled error from processShareIntent.",
      );
      SendIntent.finish();
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <BrowserMessageContext.Provider
      value={{
        getExtensionLink,
        addMessageListener,
        removeMessageListener,
        checkSavingAvailable,
        saveItemContent,
        savingItem,
        savingError:
          savingError || (captureError ? <p>{captureError}</p> : null),
        clearSavingError,
      }}
    >
      {children}
    </BrowserMessageContext.Provider>
  );
};
