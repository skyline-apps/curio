import React from "react";

import AccountSettings from "./AccountSettings";
import LabelSettings from "./LabelSettings";
import UpdateUserSettings from "./UpdateUserSettings";

const SettingsForm: React.FC = () => {
  return (
    <>
      <h2 className="text-lg my-2">Account settings</h2>
      <AccountSettings />
      <h2 className="text-lg my-2">Preferences</h2>
      <LabelSettings />
      <h2 className="text-lg my-2">Display</h2>
      <UpdateUserSettings />
      <div className="flex flex-col h-full justify-end items-center text-xs text-secondary py-4">
        <p>
          Questions? Contact us at{" "}
          <a className="hover:underline" href="mailto:team@curi.ooo">
            team@curi.ooo
          </a>
          .
        </p>
        {process.env.VERCEL_GIT_COMMIT_SHA && (
          <p>Build number: {process.env.VERCEL_GIT_COMMIT_SHA}</p>
        )}
      </div>
    </>
  );
};

export default SettingsForm;
