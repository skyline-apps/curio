/// <reference types="cordova-plugin-inappbrowser" />

import { createLogger } from "@app/utils/logger";
import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    cordova: {
      InAppBrowser: {
        open: (url: string, target?: string, options?: string) => InAppBrowser;
      };
    };
  }
}

const log = createLogger("use-in-app-browser-capture");
const SCRIPT_EXECUTION_TIMEOUT_MS = 5000;

export interface UseInAppBrowserCaptureOptions {
  onHtmlCaptured: (html: string | null, urlToSave: string | null) => void;
  onCaptureProcessClosed: () => void;
}

export interface UseInAppBrowserCaptureReturn {
  startCapture: (urlToOpen: string, urlToSave: string) => void;
  cancelCapture: () => void;
  isCapturing: boolean;
  captureError: string | null;
}

export const useInAppBrowserCapture = ({
  onHtmlCaptured,
  onCaptureProcessClosed,
}: UseInAppBrowserCaptureOptions): UseInAppBrowserCaptureReturn => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [urlToOpen, setUrlToOpen] = useState<string | null>(null);
  const [urlToSave, setUrlToSave] = useState<string | null>(null);

  const iabRef = useRef<InAppBrowser | null>(null);
  const scriptExecutionTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  const performFullClose = useCallback(() => {
    if (scriptExecutionTimeoutIdRef.current) {
      clearTimeout(scriptExecutionTimeoutIdRef.current);
      scriptExecutionTimeoutIdRef.current = null;
    }
    if (iabRef.current) {
      const refToClose = iabRef.current;
      iabRef.current = null;
      refToClose.close();
    }
    setIsCapturing(false);
    setCaptureError(null);
    setUrlToOpen(null);
    setUrlToSave(null);
    onCaptureProcessClosed();
  }, [onCaptureProcessClosed]);

  const startCapture = useCallback(
    (urlToOpen: string, urlToSave: string) => {
      if (isCapturing) {
        log.warn(
          `startCapture called for ${urlToOpen} while already capturing. Aborting new request.`,
        );
        return;
      }
      log.info(
        `startCapture called. URL to open: ${urlToOpen}, URL to save: ${urlToSave}.`,
      );
      setCaptureError(null);
      setIsCapturing(true);
      setUrlToOpen(urlToOpen);
      setUrlToSave(urlToSave);
    },
    [isCapturing],
  );

  const cancelCapture = useCallback(() => {
    if (isCapturing) {
      setCaptureError("Capture cancelled by user.");
      onHtmlCaptured(null, urlToSave);
    }
    performFullClose();
  }, [isCapturing, onHtmlCaptured, performFullClose, urlToSave]);

  useEffect(() => {
    if (!urlToOpen || !isCapturing) {
      return;
    }

    const iabInstance = window.cordova.InAppBrowser.open(
      urlToOpen,
      "_blank",
      "location=no,hidden=yes,clearcache=yes,clearsessioncache=yes",
    );
    iabRef.current = iabInstance;
    const localIabRef = iabInstance;

    const handleLoadStopEvent = (): void => {
      if (scriptExecutionTimeoutIdRef.current) {
        clearTimeout(scriptExecutionTimeoutIdRef.current);
        scriptExecutionTimeoutIdRef.current = null;
      }
      scriptExecutionTimeoutIdRef.current = setTimeout(() => {
        log.warn(
          `Script execution timed out after ${SCRIPT_EXECUTION_TIMEOUT_MS}ms.`,
        );
        setCaptureError("Page content retrieval timed out.");
        onHtmlCaptured(null, urlToSave);
        performFullClose();
      }, SCRIPT_EXECUTION_TIMEOUT_MS);

      localIabRef.executeScript(
        {
          code: "webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify({ html: document.documentElement.outerHTML }));",
        },
        (_values) => {
          if (scriptExecutionTimeoutIdRef.current) {
            clearTimeout(scriptExecutionTimeoutIdRef.current);
            scriptExecutionTimeoutIdRef.current = null;
          } else {
            log.warn(
              "Script execution callback received but no timeout ID was present. Might have already timed out or been cleared.",
            );
            if (!isCapturing && iabRef.current !== localIabRef) return;
          }
        },
      );
    };

    const handleMessage = (event: MessageEvent): void => {
      log.info("Message received:", JSON.stringify(event));
      try {
        const html = event.data.html;
        log.info("HTML received:", html.length);
        onHtmlCaptured(html, urlToSave);
        performFullClose();
      } catch (error) {
        log.error("Error processing message:", error);
        setCaptureError("Error processing page content.");
        onHtmlCaptured(null, urlToSave);
        performFullClose();
      }
    };

    const handleLoadErrorEvent = (event: InAppBrowserEvent): void => {
      if (event.url !== urlToOpen) {
        log.warn(
          `Load error for ${event.url}, but current capture is for ${urlToOpen}. Ignoring. Error: ${event.message}`,
        );
        return;
      }
      setCaptureError(`Error loading page: ${event.message}`);
      onHtmlCaptured(null, urlToSave);
      performFullClose();
    };

    const handleExitEvent = (): void => {
      if (iabRef.current !== localIabRef && iabRef.current !== null) {
        log.warn(
          "Exit event for an IAB instance that is not the one managed by this current effect. Instance might be newer or already closed by its own logic.",
        );
      }

      if (scriptExecutionTimeoutIdRef.current) {
        clearTimeout(scriptExecutionTimeoutIdRef.current);
        scriptExecutionTimeoutIdRef.current = null;
        log.info(
          "IAB exited before script completion/timeout. Capture considered cancelled/failed.",
        );
        setCaptureError("Page closed before content could be captured.");
        onHtmlCaptured(null, urlToSave);
      }
      performFullClose();
    };

    localIabRef.addEventListener(
      "message",
      handleMessage as unknown as InAppBrowserEventListener,
    );
    localIabRef.addEventListener("loadstop", handleLoadStopEvent);
    localIabRef.addEventListener("loaderror", handleLoadErrorEvent);
    localIabRef.addEventListener("exit", handleExitEvent);

    localIabRef.show();

    return () => {
      localIabRef.removeEventListener(
        "message",
        handleMessage as unknown as InAppBrowserEventListener,
      );
      localIabRef.removeEventListener("loadstop", handleLoadStopEvent);
      localIabRef.removeEventListener("loaderror", handleLoadErrorEvent);
      localIabRef.removeEventListener("exit", handleExitEvent);

      if (iabRef.current === localIabRef) {
        performFullClose();
      }
    };
  }, [
    urlToOpen,
    urlToSave,
    isCapturing,
    onHtmlCaptured,
    onCaptureProcessClosed,
    performFullClose,
  ]);

  return {
    startCapture,
    cancelCapture,
    isCapturing,
    captureError,
  };
};
