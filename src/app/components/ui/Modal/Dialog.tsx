import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import React from "react";

import { useDialog } from "./actions";

export const Dialog = (): React.ReactElement => {
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
          {(dialog.type === "confirm" ||
            dialog.type === "destructive-confirm") && (
            <Button
              size="sm"
              color={
                dialog.type === "destructive-confirm" ? "default" : "danger"
              }
              variant="light"
              onPress={handleCancel}
            >
              {dialog.cancelLabel || "Cancel"}
            </Button>
          )}
          <Button
            size="sm"
            color={dialog.type === "destructive-confirm" ? "danger" : "default"}
            onPress={handleConfirm}
          >
            {dialog.confirmLabel || "OK"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
