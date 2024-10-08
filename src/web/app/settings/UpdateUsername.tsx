import React, { useContext, useState } from "react";

import Button from "@/components/Button";
import { FormSection } from "@/components/Form";
import Input from "@/components/Input";
import { Spinner } from "@/components/Spinner";
import { UserContext } from "@/providers/UserProvider";
import { createLogger } from "@/utils/logger";

const log = createLogger("UpdateUsername");

const UpdateUsername: React.FC = () => {
  const { user, changeUsername } = useContext(UserContext);
  const [newUsername, setNewUsername] = useState<string>(user.username || "");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const updateUsername = async (): Promise<void> => {
    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");
    changeUsername(newUsername)
      .then(() => {
        setSuccessMessage("Successfully updated username.");
        setSubmitting(false);
      })
      .catch((error) => {
        log.error("Error updating username: ", error);
        setErrorMessage(`${error}`);
        setSubmitting(false);
      });
  };

  const submitEnabled = newUsername !== user.username;
  if (!user.id) {
    return <Spinner />;
  }

  return (
    <FormSection
      className="max-w-md"
      title="Username"
      description="Update your username. This will change your profile URL."
      actions={
        <Button
          size="sm"
          isDisabled={!submitEnabled}
          isLoading={submitting}
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
        value={newUsername}
        onChange={(event) => setNewUsername(event.target.value)}
      />
    </FormSection>
  );
};

export default UpdateUsername;
