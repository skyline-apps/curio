"use client";

import React, { useContext, useEffect, useState } from "react";

import Button from "@/components/ui/Button";
import { FormSection } from "@/components/ui/Form";
import Input from "@/components/ui/Input";
import { Dialog, showAlert, showConfirm } from "@/components/ui/Modal/Dialog";
import Snippet from "@/components/ui/Snippet";
import Spinner from "@/components/ui/Spinner";
import { SelectApiKey } from "@/db/schema";
import { UserContext } from "@/providers/UserProvider";
import { createLogger } from "@/utils/logger";

import { createApiKey, listApiKeys, revokeApiKey } from "./actions";

const log = createLogger("AccountSettings");

const AccountSettings: React.FC = () => {
  const { user, changeUsername } = useContext(UserContext);
  const [newUsername, setNewUsername] = useState<string>(user.username || "");
  const [usernameSuccess, setUsernameSuccess] = useState<string>("");
  const [usernameError, setUsernameError] = useState<string>("");
  const [submittingUsername, setSubmittingUsername] = useState<boolean>(false);

  const [keyName, setKeyName] = useState<string>("");
  const [apiKeys, setApiKeys] = useState<SelectApiKey[]>([]);
  const [submittingKey, setSubmittingKey] = useState<boolean>(false);
  const [apiKeyError, setApiKeyError] = useState<string>("");
  const [apiKeySuccess, setApiKeySuccess] = useState<string>("");
  const [isRefreshingKeys, setIsRefreshingKeys] = useState<boolean>(true);

  useEffect(() => {
    if (user?.username) {
      setNewUsername(user.username);
    }
  }, [user?.username]);

  useEffect(() => {
    setIsRefreshingKeys(true);
    loadApiKeys();
  }, []);

  const loadApiKeys = async (): Promise<void> => {
    const keys = await listApiKeys();
    setApiKeys(keys);
    setIsRefreshingKeys(false);
  };

  const handleCreateKey = async (): Promise<void> => {
    if (!keyName) return;
    setSubmittingKey(true);
    setApiKeyError("");
    setApiKeySuccess("");
    try {
      const newKey = await createApiKey(keyName);
      if (newKey) {
        showAlert(
          <>
            <p>Your new API key is: </p>
            <Snippet>{newKey.key}</Snippet>
            <p>Please save this key as it won&apos;t be shown again.</p>
          </>,
          "New API key created",
        );
        setApiKeySuccess("API key created successfully");
        await loadApiKeys();
      }
    } catch (error) {
      log.error("Failed to create API key", { error });
      setApiKeyError("Failed to create API key");
    } finally {
      setSubmittingKey(false);
      setKeyName("");
    }
  };

  const handleRevokeKey = async (keyId: string): Promise<void> => {
    showConfirm(
      "Are you sure you want to revoke this API key? This action cannot be undone.",
      async () => {
        setSubmittingKey(true);
        try {
          await revokeApiKey(keyId);
          await loadApiKeys();
          setApiKeySuccess("API key revoked successfully");
        } catch (error) {
          log.error("Failed to revoke API key", { error });
          setApiKeyError("Failed to revoke API key");
        } finally {
          setSubmittingKey(false);
        }
      },
      "Revoke API key",
    );
  };

  const updateUsername = async (): Promise<void> => {
    setSubmittingUsername(true);
    setUsernameError("");
    setUsernameSuccess("");
    try {
      await changeUsername(newUsername);
      setUsernameSuccess("Successfully updated username.");
    } catch (error) {
      log.error("Error updating username: ", error);
      setUsernameError(`${error}`);
    } finally {
      setSubmittingUsername(false);
    }
  };

  if (!user?.id) {
    return <Spinner />;
  }

  const submitEnabled = newUsername !== user.username;

  return (
    <div className="space-y-8">
      <Dialog />
      <FormSection
        title="Username"
        description="Update your username. This will change your profile URL."
        errorMessage={usernameError}
        successMessage={usernameSuccess}
      >
        <div className="flex gap-4 w-full max-w-96">
          <Input
            type="text"
            name="username"
            value={newUsername}
            className="flex-1"
            onChange={(event) => setNewUsername(event.target.value)}
          />
          <Button
            size="sm"
            isDisabled={!submitEnabled}
            isLoading={submittingUsername}
            onPress={updateUsername}
          >
            Update
          </Button>
        </div>
      </FormSection>

      <FormSection
        title="API keys"
        description="Create and manage API keys to access your account programmatically."
        errorMessage={apiKeyError}
        successMessage={apiKeySuccess}
      >
        <div className="space-y-6 w-full max-w-96">
          <div className="space-y-4">
            {isRefreshingKeys ? (
              <></>
            ) : apiKeys.length === 0 ? (
              <p className="text-sm text-secondary-foreground">
                No API keys found.
              </p>
            ) : (
              apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div>
                    <p className="text-sm">{key.name}</p>
                    <p className="text-xs text-secondary-foreground">
                      Created {new Date(key.createdAt).toLocaleDateString()}
                      {key.lastUsedAt &&
                        ` • Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <Button
                    color="danger"
                    size="sm"
                    onPress={() => handleRevokeKey(key.id)}
                    isDisabled={submittingKey || !key.isActive}
                  >
                    {key.isActive ? "Revoke" : "Revoked"}
                  </Button>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-4">
            <Input
              placeholder="Key name"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              className="flex-1"
              maxLength={30}
            />
            <Button
              size="sm"
              onPress={handleCreateKey}
              isDisabled={submittingKey || keyName === ""}
            >
              Create
            </Button>
          </div>
        </div>
      </FormSection>
    </div>
  );
};

export default AccountSettings;
