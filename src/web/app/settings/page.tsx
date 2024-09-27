"use client";
import React, { useContext, useState } from "react";

import { type UpdateUsernameResponse } from "@/app/api/v1/user/username/route";
import { FormButton } from "@/components/Button";
import Card from "@/components/Card";
import Form from "@/components/Form";
import Input from "@/components/Input";
import { UserContext } from "@/providers/UserProvider";
import { handleAPIResponse } from "@/utils/api";
import { createLogger } from "@/utils/logger";

const log = createLogger("SettingsPage");

const SettingsPage: React.FC = () => {
  const { user, changeUsername } = useContext(UserContext);
  const [newUsername, setNewUsername] = useState<string>(user.username || "");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  if (!user.id || !user.username) {
    return <p className="text-danger">User not found.</p>;
  }

  const updateUsername = async (): Promise<void> => {
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
      })
      .catch((error) => {
        log.error("Error updating username: ", error);
        setErrorMessage(`${error}`);
      });
  };

  const submitEnabled = newUsername !== user.username;

  return (
    <>
      <h2 className="mb-2">Account settings</h2>
      <Form action={updateUsername}>
        <Input
          type="text"
          label="Username"
          name="username"
          value={newUsername}
          onChange={(event) => setNewUsername(event.target.value)}
        />
        {successMessage && (
          <Card className="text-success text-sm">{successMessage}</Card>
        )}
        {errorMessage && (
          <Card className="text-danger text-sm">{errorMessage}</Card>
        )}
        <FormButton isDisabled={!submitEnabled}>Update</FormButton>
      </Form>
    </>
  );
};

export default SettingsPage;
