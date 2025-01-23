import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
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

const useDialog = create<DialogStore>()((set) => ({
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

export const Dialog = (): JSX.Element => {
  const dialog = useDialog();

  const handleConfirm = (): void => {
    dialog.onConfirm?.();
    dialog.hideDialog();
  };

  const handleCancel = (): void => {
    dialog.onCancel?.();
    dialog.hideDialog();
  };

  return (
    <Modal isOpen={dialog.isOpen} onClose={handleCancel}>
      <ModalContent>
        {dialog.title && <ModalHeader>{dialog.title}</ModalHeader>}
        <ModalBody className="text-sm">{dialog.message}</ModalBody>
        <ModalFooter>
          {dialog.type === "confirm" && (
            <Button
              size="sm"
              color="danger"
              variant="light"
              onPress={handleCancel}
            >
              {dialog.cancelLabel || "Cancel"}
            </Button>
          )}
          <Button size="sm" color="primary" onPress={handleConfirm}>
            {dialog.confirmLabel || "OK"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

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
