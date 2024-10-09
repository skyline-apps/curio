"use client";
import React, { useContext } from "react";

import AppPage from "@/components/AppPage";
import { UserContext } from "@/providers/UserProvider";

import SettingsForm from "./SettingsForm";

const SettingsPage: React.FC = () => {
  const { user } = useContext(UserContext);
  if (!user.id || !user.username) {
    return <p className="text-danger">User not found.</p>;
  }

  return (
    <AppPage>
      <div className="mx-auto max-w-screen-md">
        <SettingsForm />
      </div>
    </AppPage>
  );
};

export default SettingsPage;
