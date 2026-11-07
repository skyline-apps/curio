import type { ToastType } from "@app/components/ui/Toast";
import React, { createContext, useContext } from "react";

export interface ToastAction {
  label: string;
  onClick: () => void | Promise<void>;
}

export interface ToastOptions {
  duration?: number;
  dismissable?: boolean;
  disappearing?: boolean;
  type?: ToastType;
  className?: string;
  action?: ToastAction;
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
