import React from "react";
import { create } from "zustand";

type DialogParams = {
  title?: string;
  message?: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
};

interface DialogStore {
  isOpen: boolean;
  title?: string;
  message?: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  type: "alert" | "confirm";
  showDialog: (params: DialogParams & { type: "alert" | "confirm" }) => void;
  hideDialog: () => void;
}

export const useDialog = create<DialogStore>()((set) => ({
  isOpen: false,
  type: "alert",
  title: undefined,
  message: undefined,
  confirmLabel: undefined,
  cancelLabel: undefined,
  onConfirm: undefined,
  onCancel: undefined,
  showDialog: (params) =>
    set({
      isOpen: true,
      ...params,
    }),
  hideDialog: () =>
    set({
      isOpen: false,
      title: undefined,
      message: undefined,
      confirmLabel: undefined,
      cancelLabel: undefined,
      onConfirm: undefined,
      onCancel: undefined,
    }),
}));
// Utility functions for common use cases

export function showAlert(
  message: string | React.ReactNode,
  title?: string,
): void {
  useDialog.getState().showDialog({
    type: "alert",
    message,
    title,
  });
}

export function showConfirm(
  message: string | React.ReactNode,
  onConfirm: () => void,
  title?: string,
): void {
  useDialog.getState().showDialog({
    type: "confirm",
    message,
    title,
    onConfirm,
  });
}
