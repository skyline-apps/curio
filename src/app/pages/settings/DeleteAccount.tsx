import Button from "@app/components/ui/Button";
import { FormSection } from "@app/components/ui/Form";
import Input from "@app/components/ui/Input";
import Modal, {
  ModalBody,
  ModalContent,
  ModalHeader,
} from "@app/components/ui/Modal";
import { useDeleteAccount } from "@app/pages/settings/actions";
import { useToast } from "@app/providers/Toast";
import { useUser } from "@app/providers/User";
import { createLogger } from "@app/utils/logger";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const log = createLogger("DeleteAccount");

const DeleteAccount: React.FC = () => {
  const { deleteAccount, isDeletingAccount } = useDeleteAccount();
  const { showToast } = useToast();
  const { clearUser } = useUser();
  const navigate = useNavigate();
  const [showGoodbyeModal, setShowGoodbyeModal] = useState(false);

  return (
    <FormSection
      title="Delete account"
      description="Permanently delete your account and all associated data. This action cannot be undone."
    >
      <Button
        size="sm"
        color="danger"
        isLoading={isDeletingAccount}
        onPress={() => setShowGoodbyeModal(true)}
      >
        Delete account
      </Button>
      {showGoodbyeModal && (
        <Modal
          isOpen={showGoodbyeModal}
          onClose={() => setShowGoodbyeModal(false)}
        >
          <ModalContent>
            <ModalHeader>Delete your account</ModalHeader>
            <ModalBody className="space-y-3">
              <div className="text-sm">
                This action will permanently delete your account and all
                associated data. This takes effect immediately and cannot be
                undone.
              </div>
              <GoodbyeForeverInput
                onConfirm={async () => {
                  try {
                    await deleteAccount();
                    showToast("Your account has been deleted.", {
                      disappearing: true,
                    });
                    setShowGoodbyeModal(false);
                    clearUser();
                    navigate("/");
                  } catch (error) {
                    log.error("Failed to delete account", { error });
                    showToast("Failed to delete account.", { type: "error" });
                  }
                }}
                onCancel={() => setShowGoodbyeModal(false)}
                isLoading={isDeletingAccount}
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </FormSection>
  );
};

const GoodbyeForeverInput: React.FC<{
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}> = ({ onConfirm, onCancel, isLoading }) => {
  const [inputValue, setInputValue] = useState("");
  const [touched, setTouched] = useState(false);
  const isMatch = inputValue.trim().toLowerCase() === "goodbye forever";
  const showError = touched && !isMatch && inputValue.length > 0;

  return (
    <div>
      <Input
        autoFocus
        placeholder="Type 'goodbye forever' to confirm"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setTouched(true);
        }}
        className={showError ? "border border-danger-600" : undefined}
      />
      {showError && (
        <div className="text-danger-600 text-xs mb-2">
          You must type "goodbye forever" exactly to proceed.
        </div>
      )}
      <div className="flex justify-end gap-2 mt-4">
        <Button onPress={onCancel} variant="light">
          Cancel
        </Button>
        <Button
          color="danger"
          isLoading={isLoading}
          isDisabled={!isMatch}
          onPress={onConfirm}
        >
          Delete Account
        </Button>
      </div>
    </div>
  );
};

export default DeleteAccount;
