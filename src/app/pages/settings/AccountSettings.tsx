import { Import } from "@app/components/Import";
import Button from "@app/components/ui/Button";
import Card from "@app/components/ui/Card";
import { FormSection } from "@app/components/ui/Form";
import Icon from "@app/components/ui/Icon";
import Input from "@app/components/ui/Input";
import { showAlert, showConfirm } from "@app/components/ui/Modal/actions";
import { Dialog } from "@app/components/ui/Modal/Dialog";
import Snippet from "@app/components/ui/Snippet";
import Spinner from "@app/components/ui/Spinner";
import { type ApiKey, useApiKeys } from "@app/pages/settings/actions";
import { useSettings } from "@app/providers/Settings";
import { useToast } from "@app/providers/Toast";
import { useUser } from "@app/providers/User";
import { createLogger } from "@app/utils/logger";
import React, { useCallback, useEffect, useState } from "react";
import { HiOutlineClipboard } from "react-icons/hi2";

const log = createLogger("AccountSettings");

const AccountSettings: React.FC = () => {
  const { listApiKeys, createApiKey, revokeApiKey } = useApiKeys();
  const { showToast } = useToast();
  const { user } = useUser();
  const { username, newsletterEmail, changeUsername, updateNewsletterEmail } =
    useSettings();
  const [newUsername, setNewUsername] = useState<string>(username || "");
  const [usernameSuccess, setUsernameSuccess] = useState<string>("");
  const [usernameError, setUsernameError] = useState<string>("");
  const [newsletterError, setNewsletterError] = useState<string>("");
  const [submittingUsername, setSubmittingUsername] = useState<boolean>(false);
  const [updatingNewsletterEmail, setUpdatingNewsletterEmail] =
    useState<boolean>(false);

  const [keyName, setKeyName] = useState<string>("");
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [submittingKey, setSubmittingKey] = useState<boolean>(false);
  const [apiKeyError, setApiKeyError] = useState<string>("");
  const [apiKeySuccess, setApiKeySuccess] = useState<string>("");
  const [isRefreshingKeys, setIsRefreshingKeys] = useState<boolean>(true);

  useEffect(() => {
    if (username) {
      setNewUsername(username);
    }
  }, [username]);

  const loadApiKeys = useCallback(async (): Promise<void> => {
    listApiKeys()
      .then((response) => setApiKeys(response.keys))
      .catch((error) => {
        log.error("Failed to load API keys", { error });
        setApiKeyError("Failed to load API keys");
      });
    setIsRefreshingKeys(false);
  }, [listApiKeys]);

  useEffect(() => {
    setIsRefreshingKeys(true);
    loadApiKeys();
  }, [loadApiKeys]);

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
    if (newsletterEmail) {
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

  const submitEnabled = newUsername !== username;

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
          {newsletterEmail && (
            <>
              <Input
                type="text"
                name="newsletterEmail"
                value={newsletterEmail}
                className="flex-1"
                disabled
              />
              <Button
                isIconOnly
                tooltip="Copy to clipboard"
                size="sm"
                onPress={() => {
                  if (newsletterEmail) {
                    navigator.clipboard.writeText(newsletterEmail);
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
        title="Import"
        description="Import items from third-party services"
      >
        <Import />
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
