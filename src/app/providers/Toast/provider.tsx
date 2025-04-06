import Toast from "@app/components/ui/Toast";
import { AnimatePresence } from "framer-motion";
import React, { useCallback, useState } from "react";

import { ToastContext, ToastOptions } from ".";

interface ToastProviderProps {
  children: React.ReactNode;
}

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
