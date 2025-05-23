import Button from "@app/components/ui/Button";
import Modal, {
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@app/components/ui/Modal";
import React from "react";

interface PocketImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PocketImportModal: React.FC<PocketImportModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>Import from Pocket</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <p className="text-sm">
              Unfortunately, Curio does not currently support importing from
              Pocket. Pocket's API only provides saved URLs without the actual
              article content, which Curio requires for import.
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            OK
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
