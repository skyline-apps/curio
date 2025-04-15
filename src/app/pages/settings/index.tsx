import { useUser } from "@app/providers/User";
import React, { useEffect } from "react";

import SettingsForm from "./SettingsForm";

const SettingsPage: React.FC = () => {
  useEffect(() => {
    document.title = `Curio - Settings`;
  }, []);

  const { user } = useUser();
  if (!user.id) {
    return <p className="text-danger">User not found.</p>;
  }

  return (
    <div className="mx-auto max-w-screen-md flex flex-col pb-4">
      <SettingsForm />
    </div>
  );
};

export default SettingsPage;
