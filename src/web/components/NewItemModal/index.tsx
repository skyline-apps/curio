import type { PressEvent } from "@react-types/shared";
import { useCallback, useEffect, useState } from "react";

import { UploadStatus } from "@/app/api/v1/items/content/validation";
import Button from "@/components/ui/Button";
import Form from "@/components/ui/Form";
import Input from "@/components/ui/Input";
import Modal, {
  ModalBody,
  ModalContent,
  ModalHeader,
} from "@/components/ui/Modal";
import { useToast } from "@/providers/ToastProvider";
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
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const closeModal = useCallback((): void => {
    setUrlInput("");
    setLoading(false);
    setError(null);
    onClose();
  }, [onClose]);

  const handleMessage = useCallback(
    async (event: MessageEvent): Promise<void> => {
      if (event.data.type === "CURIO_SAVE_SUCCESS") {
        if (!event.data.data || event.data.data.status === UploadStatus.ERROR) {
          setLoading(false);
          log.error("Error updating content", event.data);
          setError("Error saving content. Contact us if this error persists.");
          return;
        }
        // TODO: refresh items list if on items list page
        log.info("Content saved successfully", event.data);
        showToast(
          <div className="flex gap-2 items-center">
            Item successfully saved!
            <Button size="sm" href={`/items/${event.data.data.slug}`}>
              View
            </Button>
          </div>,
          { dismissable: true, disappearing: false },
        );
        closeModal();
      } else if (event.data.type === "CURIO_SAVE_ERROR") {
        setLoading(false);
        log.error("Error saving content", event.data);
        setError("Error saving content. Contact us if this error persists.");
      }
    },
    [closeModal, showToast],
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  const openAndSave = (
    event: React.FormEvent<HTMLFormElement> | PressEvent,
  ): void => {
    if ("preventDefault" in event) event.preventDefault();
    try {
      new URL(urlInput);
    } catch {
      setError("Please enter a valid URL.");
      return;
    }
    setError(null);
    try {
      setLoading(true);
      // TODO: add timeout if this takes too long
      window.postMessage(
        {
          type: "CURIO_SAVE_REQUEST",
          url: urlInput,
        },
        "http://localhost:3000",
      );
    } catch (error) {
      setError(
        "Failed to communicate with Chrome extension. Please ensure the extension is properly installed and enabled.",
      );
      log.error("Error sending save request:", error);
    }
  };

  return (
    <>
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
            <Form onSubmit={openAndSave}>
              <Input
                type="text"
                name="url"
                label="Item to save"
                labelPlacement="outside"
                placeholder="URL"
                value={urlInput}
                className="flex-1"
                onChange={(event) => setUrlInput(event.target.value)}
                autoFocus
              />
              {error && (
                <div className="mt-2 text-sm text-danger-600">{error}</div>
              )}
              <Button
                className="w-full sm:w-48 self-end"
                onPress={openAndSave}
                isLoading={loading}
              >
                Open page and save
              </Button>
            </Form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default NewItemModal;
