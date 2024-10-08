import React from "react";

import UpdateUsername from "./UpdateUsername";
import UpdateUserSettings from "./UpdateUserSettings";

const SettingsForm: React.FC = () => {
  return (
    <>
      <h2 className="text-lg mb-2">Account settings</h2>
      <UpdateUsername />
      <h2 className="text-lg mb-2">Preferences</h2>
      <UpdateUserSettings />
    </>
  );
};

export default SettingsForm;
