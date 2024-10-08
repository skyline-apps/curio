import React, { useContext, useState } from "react";

import { type UpdateUsernameResponse } from "@/app/api/v1/user/username/route";
import Button from "@/components/Button";
import { FormSection } from "@/components/Form";
import Input from "@/components/Input";
import { UserContext } from "@/providers/UserProvider";
import { handleAPIResponse } from "@/utils/api";
import { createLogger } from "@/utils/logger";

const log = createLogger("UpdateUsername");

const UpdateUsername: React.FC<> = () => {
  const { user, changeUsername } = useContext(UserContext);
  const [newUsername, setNewUsername] = useState<string>(user.username || "");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const updateUsername = async (): Promise<void> => {
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    fetch("/api/v1/user/username", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: user.id, username: newUsername }),
    })
      .then(handleAPIResponse<UpdateUsernameResponse>)
      .then((result) => {
        const { updatedUsername } = result;
        if (!updatedUsername) {
          throw Error("Failed to update username");
        }
        changeUsername(updatedUsername);
        setSuccessMessage("Successfully updated username.");
        setLoading(false);
      })
      .catch((error) => {
        log.error("Error updating username: ", error);
        setErrorMessage(`${error}`);
        setLoading(false);
      });
  };

  const submitEnabled = newUsername !== user.username;

  return (
    <FormSection
      className="max-w-md"
      title="Username"
      description="Update your username. This will change your profile URL."
      actions={
        <Button
          size="sm"
          isDisabled={!submitEnabled}
          isLoading={loading}
          onPress={updateUsername}
        >
          Update
        </Button>
      }
      successMessage={successMessage}
      errorMessage={errorMessage}
    >
      <Input
        type="text"
        name="username"
        size="sm"
        value={newUsername}
        onChange={(event) => setNewUsername(event.target.value)}
      />
    </FormSection>
  );
};

export default UpdateUsername;
