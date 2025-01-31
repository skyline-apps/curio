import { useEffect, useState } from "react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal, {
  ModalBody,
  ModalContent,
  ModalHeader,
} from "@/components/ui/Modal";
import { createLogger } from "@/utils/logger";

interface NewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const log = createLogger("NewItemModal");

const NewItemModal: React.FC<NewItemModalProps> = ({
  isOpen,
  onClose,
}: NewItemModalProps) => {
  const [urlInput, setUrlInput] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const closeModal = (): void => {
    setUrlInput("");
    onClose();
  };

  useEffect(() => {
    const handleMessage = (
      event: MessageEvent<{ type: string; error?: string }>,
    ): void => {
      if (event.data.type === "CURIO_SAVE_ERROR") {
        log.error("Error saving content", event.data);
        setError(event.data.error || "Unknown error saving content");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const openAndSave = (): void => {
    setError(null);
    try {
      window.postMessage(
        {
          type: "CURIO_SAVE_REQUEST",
          url: urlInput,
        },
        "http://localhost:3000",
      );
    } catch (error) {
      setError("Failed to communicate with Chrome extension");
      log.error("Error sending save request:", error);
    }
  };

  return (
    <Modal
      isKeyboardDismissDisabled={true}
      isOpen={isOpen}
      onClose={closeModal}
    >
      <ModalContent>
        <ModalHeader>
          <h1 className="text-2xl font-medium">New item</h1>
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-2">
            <Input
              type="text"
              name="url"
              label="Item to save"
              labelPlacement="outside"
              placeholder="URL"
              value={urlInput}
              className="flex-1"
              onChange={(event) => setUrlInput(event.target.value)}
            />
            {error && (
              <div className="mt-2 text-sm text-danger-600">{error}</div>
            )}
            <Button className="w-full sm:w-48 self-end" onPress={openAndSave}>
              Open page and save
            </Button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default NewItemModal;
