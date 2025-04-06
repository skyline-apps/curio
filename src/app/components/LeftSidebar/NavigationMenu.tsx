import Icon from "@app/components/ui/Icon";
import { Tab, Tabs } from "@app/components/ui/Tabs";
import { cn } from "@app/utils/cn";
import React from "react";
import {
  HiOutlineArchiveBox,
  HiOutlineBookOpen,
  HiOutlineHome,
  HiOutlineInbox,
} from "react-icons/hi2";

import SidebarButton from "./SidebarButton";

export enum SidebarKey {
  NONE = "",
  HOME = "/home",
  INBOX = "/inbox",
  NOTES = "/notes",
  ARCHIVE = "/archive",
}

interface NavigationMenuProps {
  sidebarOpen: boolean;
  selectedKey: string;
  onNavigation: (key: React.Key) => void;
}

const navigationItems = [
  { key: SidebarKey.HOME, label: "Home", icon: <HiOutlineHome /> },
  { key: SidebarKey.INBOX, label: "Inbox", icon: <HiOutlineInbox /> },
  { key: SidebarKey.NOTES, label: "Notes", icon: <HiOutlineBookOpen /> },
  {
    key: SidebarKey.ARCHIVE,
    label: "Archive",
    icon: <HiOutlineArchiveBox />,
  },
];

const NavigationMenu: React.FC<NavigationMenuProps> = ({
  sidebarOpen,
  selectedKey,
  onNavigation,
}) => {
  return (
    <nav className="flex flex-col p-2">
      <div className={cn(sidebarOpen ? "hidden md:block" : "hidden")}>
        <Tabs
          classNames={{
            cursor: ["bg-background-600", "dark:bg-background-600"],
            tab: "justify-start",
          }}
          isVertical
          fullWidth
          variant="light"
          selectedKey={selectedKey}
          onSelectionChange={onNavigation}
          aria-label="Navigation"
        >
          <Tab key={SidebarKey.NONE} className="hidden" />
          {navigationItems.map((item) => (
            <Tab
              key={item.key}
              title={
                <div className="flex items-center w-full h-full">
                  <Icon icon={item.icon} className="mr-2" />
                  {item.label}
                </div>
              }
            />
          ))}
        </Tabs>
      </div>
      <div
        className={cn("flex flex-col items-center space-y-4", {
          "md:hidden": sidebarOpen,
        })}
      >
        {navigationItems.map((item) => (
          <SidebarButton
            key={item.key}
            icon={item.icon}
            label={item.label}
            onPress={() => onNavigation(item.key)}
            isSelected={selectedKey === item.key}
          />
        ))}
      </div>
    </nav>
  );
};

export default NavigationMenu;
