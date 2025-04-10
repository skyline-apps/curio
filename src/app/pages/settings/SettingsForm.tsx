import { Accordion, AccordionItem } from "@app/components/ui/Accordion";
import React from "react";
import { Link } from "react-router-dom";

import AccountSettings from "./AccountSettings";
import LabelSettings from "./LabelSettings";
import UpdateUserSettings from "./UpdateUserSettings";

const SettingsForm: React.FC = () => {
  return (
    <>
      <Accordion>
        <AccordionItem
          key="organization"
          title="Organization"
          subtitle="Manage labels"
          aria-label="Organization"
        >
          <LabelSettings />
        </AccordionItem>
        <AccordionItem
          key="preferences"
          title="Preferences"
          subtitle="Display & privacy settings"
          aria-label="Preferences"
        >
          <UpdateUserSettings />
        </AccordionItem>
        <AccordionItem
          key="account"
          title="Account settings"
          subtitle="Authentication & newsletter subscriptions"
          aria-label="Account settings"
        >
          <AccountSettings />
        </AccordionItem>
      </Accordion>
      <div className="flex flex-col h-full justify-end items-center text-xs text-secondary py-4">
        <p>
          Having issues? Check the{" "}
          <Link to="https://status.curi.ooo" target="_blank">
            status page
          </Link>
          .
        </p>
        <p>
          Questions? Contact us at{" "}
          <Link className="hover:underline" to="mailto:team@curi.ooo">
            team@curi.ooo
          </Link>
          .
        </p>
      </div>
    </>
  );
};

export default SettingsForm;
