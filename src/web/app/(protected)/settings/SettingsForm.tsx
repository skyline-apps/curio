import Link from "next/link";
import React from "react";

import { Accordion, AccordionItem } from "@/components/ui/Accordion";

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
          <Link href="https://status.curi.ooo" target="_blank">
            status page
          </Link>
          .
        </p>
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
