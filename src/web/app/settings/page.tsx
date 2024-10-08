"use client";
import React, { useContext } from "react";

import { UserContext } from "@/providers/UserProvider";

import SettingsForm from "./SettingsForm";

const SettingsPage: React.FC = () => {
  const { user } = useContext(UserContext);
  if (!user.id || !user.username) {
    return <p className="text-danger">User not found.</p>;
  }

  return (
    <div className="mx-auto max-w-screen-md">
      <h2 className="text-lg mb-2">Account settings</h2>
      <SettingsForm />
    </div>
  );
};

export default SettingsPage;
