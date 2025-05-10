import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@app/components/ui/Dropdown";
import Icon from "@app/components/ui/Icon";
import { User } from "@app/components/ui/User";
import { SidebarKey } from "@app/providers/AppLayout";
import { cn } from "@app/utils/cn";
import React from "react";
import {
  HiArrowRightOnRectangle,
  HiOutlineCog6Tooth,
  HiOutlineUser,
} from "react-icons/hi2";

import SidebarButton from "./SidebarButton";

interface UserMenuProps {
  username: string | null;
  email: string | null;
  sidebarOpen: boolean;
  selectedKey: SidebarKey;
  onLogout: () => void;
  onNavigate: (path: string) => void;
}

const UserMenu: React.FC<UserMenuProps> = ({
  username,
  email,
  sidebarOpen,
  selectedKey,
  onLogout,
  onNavigate,
}) => {
  const userActionItems = [
    {
      key: SidebarKey.PROFILE,
      label: "Profile",
      icon: <HiOutlineUser />,
      onPress: () => onNavigate(`/u/${username}`),
    },
    {
      key: SidebarKey.SETTINGS,
      label: "Settings",
      icon: <HiOutlineCog6Tooth />,
      onPress: () => onNavigate("/settings"),
    },
    {
      key: "logout",
      label: "Log Out",
      icon: <HiArrowRightOnRectangle />,
      onPress: onLogout,
    },
  ];

  return (
    <div className="flex-1 overflow-hidden">
      <div className={cn(sidebarOpen ? "hidden md:block" : "hidden")}>
        <Dropdown>
          <DropdownTrigger className="p-2">
            <div className="flex justify-start w-full h-full">
              <User name={username ?? ""} description={email ?? ""} />
            </div>
          </DropdownTrigger>
          <DropdownMenu>
            {userActionItems.map((item) => (
              <DropdownItem
                key={item.key}
                startContent={<Icon icon={item.icon} />}
                onPress={item.onPress}
              >
                {item.label}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </div>
      <div
        className={cn("flex flex-col items-center space-y-2 py-2", {
          "md:hidden": sidebarOpen,
          "hidden md:flex": !sidebarOpen,
        })}
      >
        {userActionItems.map((item) => (
          <SidebarButton
            key={item.key}
            icon={item.icon}
            label={item.label}
            onPress={item.onPress}
            isSelected={selectedKey === item.key}
          />
        ))}
      </div>
    </div>
  );
};

export default UserMenu;
