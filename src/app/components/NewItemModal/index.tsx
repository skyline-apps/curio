import Button from "@app/components/ui/Button";
import Form from "@app/components/ui/Form";
import Input from "@app/components/ui/Input";
import Modal, {
  ModalBody,
  ModalContent,
  ModalHeader,
} from "@app/components/ui/Modal";
import {
  BrowserMessageContext,
  EventType,
} from "@app/providers/BrowserMessage";
import { createLogger } from "@app/utils/logger";
import type { PressEvent } from "@react-types/shared";
import { useCallback, useContext, useEffect, useState } from "react";

interface NewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const log = createLogger("NewItemModal");

const NewItemModal: React.FC<NewItemModalProps> = ({
  isOpen,
  onClose,
}: NewItemModalProps) => {
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState<string>("");
  const {
    checkSavingAvailable,
    saveItemContent,
    savingItem,
    savingError,
    clearSavingError,
    addMessageListener,
    removeMessageListener,
  } = useContext(BrowserMessageContext);

  const closeModal = useCallback((): void => {
    clearSavingError();
    setUrlInput("");
    setError(null);
    onClose();
  }, [onClose, clearSavingError]);

  useEffect((): void => {
    if (isOpen) {
      clearSavingError();
      checkSavingAvailable();
    }
  }, [isOpen, clearSavingError, checkSavingAvailable]);

  useEffect(() => {
    const handleMessage = (type: EventType): void => {
      if (type === EventType.SAVE_SUCCESS) {
        closeModal();
      }
    };

    addMessageListener(handleMessage);
    return () => removeMessageListener(handleMessage);
  }, [addMessageListener, removeMessageListener, closeModal]);

  const openAndSave = async (
    event: React.FormEvent<HTMLFormElement> | PressEvent,
  ): Promise<void> => {
    setError(null);
    clearSavingError();
    if ("preventDefault" in event) event.preventDefault();
    try {
      new URL(urlInput);
    } catch {
      setError("Please enter a valid URL.");
      return;
    }
    try {
      await saveItemContent(urlInput);
    } catch (error) {
      log.error("Error saving content:", error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred",
      );
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
            <p className="text-sm text-secondary">
              Add a new item to your library. This will open the page in a new
              tab and automatically save its content to Curio.
            </p>
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
              {savingError && (
                <div className="mt-2 text-sm text-danger-600">
                  {savingError}
                </div>
              )}
              <Button
                className="w-full sm:w-48 self-end"
                onPress={openAndSave}
                isLoading={savingItem !== null}
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
