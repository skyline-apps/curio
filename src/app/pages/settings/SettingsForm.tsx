import AppLinks from "@app/components/Landing/AppLinks";
import { Accordion, AccordionItem } from "@app/components/ui/Accordion";
import React from "react";
import { Link, useLocation } from "react-router-dom";

import AccountSettings from "./AccountSettings";
import LabelSettings from "./LabelSettings";
import SubscriptionSettings from "./SubscriptionSettings";
import UpdateUserSettings from "./UpdateUserSettings";

enum SettingsSectionKey {
  Organization = "organization",
  Preferences = "preferences",
  Account = "account",
  Subscription = "subscription",
}

const SettingsForm: React.FC = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const section =
    (params.get("section") as SettingsSectionKey) ||
    SettingsSectionKey.Organization;

  return (
    <>
      <Accordion defaultExpandedKeys={[section]}>
        <AccordionItem
          key={SettingsSectionKey.Subscription}
          title="Subscription"
          subtitle="Premium subscription settings"
          aria-label="Subscription"
        >
          <SubscriptionSettings />
        </AccordionItem>
        <AccordionItem
          key={SettingsSectionKey.Organization}
          title="Organization"
          subtitle="Manage labels"
          aria-label="Organization"
        >
          <LabelSettings />
        </AccordionItem>
        <AccordionItem
          key={SettingsSectionKey.Preferences}
          title="Preferences"
          subtitle="Display & privacy settings"
          aria-label="Preferences"
        >
          <UpdateUserSettings />
        </AccordionItem>
        <AccordionItem
          key={SettingsSectionKey.Account}
          title="Account settings"
          subtitle="Authentication & newsletter subscriptions"
          aria-label="Account settings"
        >
          <AccountSettings />
        </AccordionItem>
      </Accordion>
      <div className="flex flex-col h-full justify-end items-center text-xs text-secondary py-4">
        <AppLinks size={20} />
        <p>
          Need help? View our{" "}
          <Link className="hover:underline" to="/docs" target="_blank">
            documentation
          </Link>
          .
        </p>
        <p>
          Having issues? Check the{" "}
          <Link to="https://status.curi.ooo" target="_blank">
            status page
          </Link>
          .
        </p>
        <p>
          <Link className="hover:underline" to="/terms" target="_blank">
            Terms of Service
          </Link>
          {" • "}
          <Link className="hover:underline" to="/privacy" target="_blank">
            Privacy Policy
          </Link>
        </p>
        {import.meta.env.VITE_BUILD_HASH && (
          <p>Build number: {import.meta.env.VITE_BUILD_HASH.substring(0, 7)}</p>
        )}
      </div>
    </>
  );
};

export default SettingsForm;
