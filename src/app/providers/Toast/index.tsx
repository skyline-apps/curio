import type { ToastType } from "@app/components/ui/Toast";
import React, { createContext, useContext } from "react";

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
export const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
  hideToast: () => {},
});

export const useToast = (): ToastContextType => useContext(ToastContext);
