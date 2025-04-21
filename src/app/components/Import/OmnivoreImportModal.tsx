import Button from "@app/components/ui/Button";
import { FileUpload } from "@app/components/ui/FileUpload";
import Modal, {
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@app/components/ui/Modal";
import React, { useState } from "react";

import { useTriggerOmnivoreImport } from "./actions";

interface OmnivoreImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OmnivoreImportModal: React.FC<OmnivoreImportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    mutate: triggerImport,
    isPending,
    error,
    reset: resetMutation,
  } = useTriggerOmnivoreImport();

  const handleFileAccepted = (file: File): void => {
    setSelectedFile(file);
    resetMutation();
  };

  const handleSubmit = (): void => {
    if (!selectedFile) {
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    triggerImport(formData, {
      onSuccess: () => {
        handleClose();
      },
    });
  };

  const handleClose = (): void => {
    setSelectedFile(null);
    resetMutation();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalContent>
        <ModalHeader>Import from Omnivore</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <p className="text-sm">Upload your Omnivore export file (.zip).</p>
            <FileUpload
              accept={{ "application/zip": [".zip"] }}
              onFileAccepted={handleFileAccepted}
              label="Drag & drop your Omnivore export here, or click to select a file"
              disabled={isPending}
            />
            {error && (
              <p className="text-sm text-danger">
                Error: {error?.message || "Failed to start import."}
              </p>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isDisabled={!selectedFile || isPending}
            isLoading={isPending}
          >
            Start import
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
