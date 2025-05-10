/// <reference types="cordova-plugin-inappbrowser" />

import Button from "@app/components/ui/Button";
import { createLogger } from "@app/utils/logger";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { HiOutlineXMark } from "react-icons/hi2";

const log = createLogger("content-capture-modal");

declare global {
  interface Window {
    cordova: {
      InAppBrowser: {
        open: (url: string, target?: string, options?: string) => InAppBrowser;
      };
    };
  }
}

interface ContentCaptureModalProps {
  url: string | null;
  onClose: () => void;
  onHtmlCaptured: (html: string | null) => void;
}

const SCRIPT_EXECUTION_TIMEOUT_MS = 10000;

const ContentCaptureModal: React.FC<ContentCaptureModalProps> = ({
  url,
  onClose,
  onHtmlCaptured,
}) => {
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [captureError, setCaptureError] = useState<string | null>(null);

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
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (
      !url ||
      typeof window.cordova === "undefined" ||
      !window.cordova.InAppBrowser
    ) {
      log.warn(
        "InAppBrowser conditions not met. URL or InAppBrowser not available.",
      );
      setCaptureError(
        "Content capture feature is not available. InAppBrowser might be missing.",
      );
      setIsPageLoading(false);
      onClose();
      return;
    }

    setIsPageLoading(true);
    setCaptureError(null);

    const options =
      "location=no,hidden=yes,clearcache=yes,clearsessioncache=yes";
    const localIabRef = window.cordova.InAppBrowser.open(
      url,
      "_blank",
      options,
    );
    iabRef.current = localIabRef;

    const handleLoadStopEvent = (event: InAppBrowserEvent): void => {
      log.info("IAB loadstop event:", event.url);
      setIsPageLoading(false);

      if (iabRef.current !== localIabRef) {
        log.warn("loadstop event for a stale IAB instance. Ignoring.");
        return;
      }

      localIabRef.show();

      if (scriptExecutionTimeoutIdRef.current) {
        clearTimeout(scriptExecutionTimeoutIdRef.current);
      }

      scriptExecutionTimeoutIdRef.current = setTimeout(() => {
        log.warn(
          `Script execution timed out after ${SCRIPT_EXECUTION_TIMEOUT_MS}ms for ${url}`,
        );
        scriptExecutionTimeoutIdRef.current = null;
        if (iabRef.current === localIabRef) {
          setCaptureError(
            "Failed to retrieve content from the page: Operation timed out.",
          );
          onHtmlCaptured(null);
          performFullClose();
        } else {
          log.info(
            "Script execution timeout fired for a stale IAB instance. Modal may have been closed or re-opened with new URL.",
          );
        }
      }, SCRIPT_EXECUTION_TIMEOUT_MS);

      localIabRef.executeScript(
        { code: "document.documentElement.outerHTML;" },
        (values: [string]) => {
          if (!scriptExecutionTimeoutIdRef.current) {
            log.info(
              "executeScript callback received, but timeout already fired or cleared. Ignoring.",
            );
            return;
          }

          clearTimeout(scriptExecutionTimeoutIdRef.current);
          scriptExecutionTimeoutIdRef.current = null;

          if (iabRef.current !== localIabRef) {
            log.warn(
              "executeScript callback for a stale IAB instance. Ignoring.",
            );
            return;
          }

          log.info("executeScript raw result: ", values);

          if (values && values.length > 0 && typeof values[0] === "string") {
            const htmlContent = values[0];
            log.info("Successfully auto-captured HTML content.");
            onHtmlCaptured(htmlContent);
          } else {
            log.error(
              "Failed to auto-capture HTML. executeScript callback did not return a string.",
              values,
            );
            setCaptureError(
              "Failed to retrieve content from the page automatically.",
            );
            onHtmlCaptured(null);
          }
          performFullClose();
        },
      );
    };

    const handleLoadErrorEvent = (event: InAppBrowserEvent): void => {
      log.error(
        "IAB loaderror event:",
        event.message,
        "URL:",
        event.url,
        "Code:",
        event.code,
      );
      setIsPageLoading(false);
      if (scriptExecutionTimeoutIdRef.current) {
        clearTimeout(scriptExecutionTimeoutIdRef.current);
        scriptExecutionTimeoutIdRef.current = null;
      }
      if (iabRef.current === localIabRef) {
        setCaptureError(`Error loading page: ${event.message}`);
        onHtmlCaptured(null);
        performFullClose();
      }
    };

    const handleExitEvent = (): void => {
      if (scriptExecutionTimeoutIdRef.current) {
        clearTimeout(scriptExecutionTimeoutIdRef.current);
        scriptExecutionTimeoutIdRef.current = null;
      }
      if (iabRef.current === localIabRef) {
        log.info("Exit event for current IAB instance. Triggering full close.");
        performFullClose();
      } else {
        log.info(
          "Exit event for a stale or already handled IAB instance. Ensuring modal parent is notified to close.",
        );
        onClose();
      }
    };

    localIabRef.addEventListener("loadstop", handleLoadStopEvent);
    localIabRef.addEventListener("loaderror", handleLoadErrorEvent);
    localIabRef.addEventListener("exit", handleExitEvent);

    return () => {
      localIabRef.removeEventListener("loadstop", handleLoadStopEvent);
      localIabRef.removeEventListener("loaderror", handleLoadErrorEvent);
      localIabRef.removeEventListener("exit", handleExitEvent);

      if (scriptExecutionTimeoutIdRef.current) {
        clearTimeout(scriptExecutionTimeoutIdRef.current);
        scriptExecutionTimeoutIdRef.current = null;
      }

      if (iabRef.current === localIabRef) {
        performFullClose();
      }
    };
  }, [url, onHtmlCaptured, performFullClose, onClose]);

  const handleManualClose = useCallback((): void => {
    performFullClose();
  }, [performFullClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-full max-w-md flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700 flex-shrink-0">
          <h3
            className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 truncate"
            title={url ?? undefined}
          >
            Capturing Content
          </h3>
          <Button onPress={handleManualClose} variant="ghost">
            <HiOutlineXMark className="h-6 w-6" />
          </Button>
        </div>

        {/* Body - Status and Error Display */}
        <div className="p-6 flex-grow flex flex-col items-center justify-center space-y-4 min-h-[150px]">
          {isPageLoading && (
            <div className="flex flex-col items-center justify-center text-center">
              <svg
                className="animate-spin h-8 w-8 text-blue-500 mb-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="text-neutral-600 dark:text-neutral-300">
                Loading page in secure browser...
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Please wait until the page is fully loaded.
              </p>
            </div>
          )}

          {captureError && (
            <div className="flex flex-col items-center justify-center text-center">
              <HiOutlineXMark className="h-8 w-8 text-red-500 mb-2" />
              <p className="text-neutral-700 dark:text-neutral-200 font-semibold">
                Capture Failed
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                {captureError}
              </p>
            </div>
          )}
          {!isPageLoading && !captureError && (
            <div className="flex flex-col items-center justify-center text-center">
              <svg
                className="h-8 w-8 text-green-500 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
              <p className="text-neutral-700 dark:text-neutral-200 font-semibold">
                Processing Complete
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                The content has been processed.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentCaptureModal;
