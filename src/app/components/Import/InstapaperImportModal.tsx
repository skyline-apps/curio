import Button from "@app/components/ui/Button";
import Input from "@app/components/ui/Input";
import Modal, {
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@app/components/ui/Modal";
import { useState } from "react";

import { useTriggerInstapaperImport } from "./actions";

interface InstapaperImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstapaperImportModal: React.FC<InstapaperImportModalProps> = ({
  isOpen,
  onClose,
}: InstapaperImportModalProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { mutate: triggerImport, isPending } = useTriggerInstapaperImport();

  const handleSubmit = (): void => {
    if (username) {
      triggerImport(
        { username, password },
        {
          onSuccess: () => {
            onClose();
            setUsername("");
            setPassword("");
          },
        },
      );
    }
  };

  const handleClose = (): void => {
    setUsername("");
    setPassword("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalContent>
        <ModalHeader>Import from Instapaper</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Input
              label="Username"
              value={username}
              onValueChange={setUsername}
              isDisabled={isPending}
              placeholder="Enter your Instapaper username or email"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onValueChange={setPassword}
              isDisabled={isPending}
              placeholder="Enter your Instapaper password"
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={handleClose} isDisabled={isPending}>
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isDisabled={!username || isPending}
            isLoading={isPending}
          >
            Start import
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
