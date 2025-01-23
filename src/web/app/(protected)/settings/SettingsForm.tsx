import React from "react";

import AccountSettings from "./AccountSettings";
import UpdateUserSettings from "./UpdateUserSettings";

const SettingsForm: React.FC = () => {
  return (
    <>
      <h2 className="text-lg my-2">Account settings</h2>
      <AccountSettings />
      <h2 className="text-lg my-2">Preferences</h2>
      <UpdateUserSettings />
    </>
  );
};

export default SettingsForm;
