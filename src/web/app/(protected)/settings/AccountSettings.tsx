"use client";

import React, { useContext, useEffect, useState } from "react";
import { HiOutlineClipboard } from "react-icons/hi2";

import Button from "@web/components/ui/Button";
import Card from "@web/components/ui/Card";
import { FormSection } from "@web/components/ui/Form";
import Icon from "@web/components/ui/Icon";
import Input from "@web/components/ui/Input";
import { Dialog, showAlert, showConfirm } from "@web/components/ui/Modal/Dialog";
import Snippet from "@web/components/ui/Snippet";
import Spinner from "@web/components/ui/Spinner";
import { SelectApiKey } from "@web/db/schema";
import { useToast } from "@web/providers/ToastProvider";
import { UserContext } from "@web/providers/UserProvider";
import { createLogger } from "@web/utils/logger";

import { createApiKey, listApiKeys, revokeApiKey } from "./actions";

const log = createLogger("AccountSettings");

const AccountSettings: React.FC = () => {
  const { showToast } = useToast();
  const { user, changeUsername, updateNewsletterEmail } =
    useContext(UserContext);
  const [newUsername, setNewUsername] = useState<string>(user.username || "");
  const [usernameSuccess, setUsernameSuccess] = useState<string>("");
  const [usernameError, setUsernameError] = useState<string>("");
  const [newsletterError, setNewsletterError] = useState<string>("");
  const [submittingUsername, setSubmittingUsername] = useState<boolean>(false);
  const [updatingNewsletterEmail, setUpdatingNewsletterEmail] =
    useState<boolean>(false);

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

  const refreshNewsletterEmail = async (): Promise<void> => {
    setNewsletterError("");
    if (user?.newsletterEmail) {
      showConfirm(
        "Are you sure you want to update your newsletter email? Newsletters using your existing email will no longer arrive in your inbox.",
        async () => {
          setUpdatingNewsletterEmail(true);
          try {
            await updateNewsletterEmail();
          } catch (error) {
            log.error("Error updating newsletter email: ", error);
            setNewsletterError(`${error}`);
          } finally {
            setUpdatingNewsletterEmail(false);
          }
        },
        "Update newsletter email",
      );
    } else {
      setUpdatingNewsletterEmail(true);
      try {
        await updateNewsletterEmail();
      } catch (error) {
        log.error("Error updating newsletter email: ", error);
        setNewsletterError(`${error}`);
      } finally {
        setUpdatingNewsletterEmail(false);
      }
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
        title="Newsletter email"
        description="Subscribe to email newsletters with this email to receive them in your Curio inbox."
        errorMessage={newsletterError}
      >
        <div className="flex gap-2 w-full max-w-96">
          {user?.newsletterEmail && (
            <>
              <Input
                type="text"
                name="newsletterEmail"
                value={user.newsletterEmail}
                className="flex-1"
                disabled
              />
              <Button
                isIconOnly
                tooltip="Copy to clipboard"
                size="sm"
                onPress={() => {
                  if (user.newsletterEmail) {
                    navigator.clipboard.writeText(user.newsletterEmail);
                    showToast("Newsletter email copied to clipboard!", {
                      disappearing: true,
                    });
                  }
                }}
              >
                <Icon icon={<HiOutlineClipboard />} />
              </Button>
            </>
          )}
          <Button
            size="sm"
            isLoading={updatingNewsletterEmail}
            onPress={refreshNewsletterEmail}
          >
            Generate
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
                <Card
                  key={key.id}
                  className="flex-row items-center justify-between p-2"
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
                </Card>
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
