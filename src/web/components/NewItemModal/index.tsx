import { useState } from "react";

import Input from "@/components/ui/Input";
import Modal, {
  ModalBody,
  ModalContent,
  ModalHeader,
} from "@/components/ui/Modal";

interface NewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NewItemModal: React.FC<NewItemModalProps> = ({
  isOpen,
  onClose,
}: NewItemModalProps) => {
  const [newUrl, setNewUrl] = useState<string>("");
  return (
    <Modal isKeyboardDismissDisabled={true} isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>
          <h1 className="text-2xl font-medium">New item</h1>
        </ModalHeader>
        <ModalBody>
          <Input
            type="text"
            name="url"
            label="Item to save"
            labelPlacement="outside"
            placeholder="URL"
            value={newUrl}
            className="flex-1"
            onChange={(event) => setNewUrl(event.target.value)}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default NewItemModal;
