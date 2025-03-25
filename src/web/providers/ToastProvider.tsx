"use client";

import Toast, { type ToastType } from "@web/components/ui/Toast";
import { AnimatePresence } from "framer-motion";
import React, { createContext, useCallback, useContext, useState } from "react";

export interface ToastOptions {
  duration?: number;
  dismissable?: boolean;
  disappearing?: boolean;
  type?: ToastType;
  className?: string;
}

export type ToastContextType = {
  showToast: (content: React.ReactNode, options?: ToastOptions) => void;
  hideToast: () => void;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
  hideToast: () => {},
});

export const useToast = (): ToastContextType => useContext(ToastContext);

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
}: ToastProviderProps): React.ReactNode => {
  const [counter, setCounter] = useState<number>(0);
  const [toast, setToast] = useState<{
    content: React.ReactNode;
    options?: ToastOptions;
  } | null>(null);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const showToast = useCallback(
    (content: React.ReactNode, options: ToastOptions = {}) => {
      setCounter((c) => c + 1);
      setToast({ content, options });

      if (options.duration !== undefined) {
        setTimeout(() => {
          hideToast();
        }, options.duration);
      }
    },
    [hideToast],
  );

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <AnimatePresence>
        {toast && (
          <Toast
            key={counter}
            dismissable={toast.options?.dismissable}
            disappearing={toast.options?.disappearing}
            type={toast.options?.type}
            className={toast.options?.className}
          >
            {toast.content}
          </Toast>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
