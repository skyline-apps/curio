import React from "react";
import {
  HiArrowRightOnRectangle,
  HiOutlineCog6Tooth,
  HiOutlineUser,
} from "react-icons/hi2";

import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@/components/Dropdown";
import Icon from "@/components/Icon";
import { User } from "@/components/User";
import { cn } from "@/utils/cn";

import SidebarButton from "./SidebarButton";

interface UserData {
  username: string | null;
  email: string | null;
}

interface UserMenuProps {
  user: UserData;
  sidebarOpen: boolean;
  selectedKey: string;
  onLogout: () => void;
  onNavigate: (path: string) => void;
}

const UserMenu: React.FC<UserMenuProps> = ({
  user,
  sidebarOpen,
  selectedKey,
  onLogout,
  onNavigate,
}) => {
  const userActionItems = [
    {
      key: "profile",
      label: "Profile",
      icon: <HiOutlineUser />,
      onPress: () => onNavigate("/profile"),
    },
    {
      key: "settings",
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
    <div className="flex-none">
      <div className={cn(sidebarOpen ? "hidden md:block" : "hidden")}>
        <Dropdown>
          <DropdownTrigger className="p-2">
            <div className="flex justify-start w-full h-full">
              <User name={user.username ?? ""} description={user.email ?? ""} />
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
