"use client";
import { usePathname, useRouter } from "next/navigation";
import React, { useContext, useEffect, useState } from "react";
import {
  HiArrowRightOnRectangle,
  HiChevronLeft,
  HiOutlineArchiveBox,
  HiOutlineCog6Tooth,
  HiOutlineHome,
  HiOutlineStar,
  HiOutlineUser,
} from "react-icons/hi2";

import Button from "@/components/Button";
import { CurioBrand, CurioLogo } from "@/components/CurioBrand";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@/components/Dropdown";
import Icon from "@/components/Icon";
import { Tab, Tabs } from "@/components/Tabs";
import { User } from "@/components/User";
import { useLogout } from "@/hooks/useLogout";
import { UserContext } from "@/providers/UserProvider";
import { cn } from "@/utils/cn";

import SidebarButton from "./SidebarButton";

enum SidebarKey {
  NONE = "",
  HOME = "/home",
  ARCHIVE = "/archive",
  FAVORITES = "/favorites",
}

const LeftSidebar: React.FC = () => {
  const router = useRouter();
  const { user } = useContext(UserContext);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const [selectedKey, setSelectedKey] = useState<string>(SidebarKey.NONE);

  const handleLogout = useLogout();

  useEffect(() => {
    const newSelectedKey = Object.values(SidebarKey).includes(
      pathname as SidebarKey,
    )
      ? pathname
      : SidebarKey.NONE;
    setSelectedKey(newSelectedKey);
  }, [pathname]);

  const handleNavigation = (key: React.Key): void => {
    router.push(key.toString());
  };

  const toggleSidebar = (): void => {
    setSidebarOpen(!sidebarOpen);
  };

  const navigationItems = [
    { key: SidebarKey.HOME, label: "Home", icon: <HiOutlineHome /> },
    {
      key: SidebarKey.ARCHIVE,
      label: "Archive",
      icon: <HiOutlineArchiveBox />,
    },
    { key: SidebarKey.FAVORITES, label: "Favorites", icon: <HiOutlineStar /> },
  ];

  const userActionItems = [
    {
      key: "profile",
      label: "Profile",
      icon: <HiOutlineUser />,
      onPress: () => router.push("/profile"),
    },
    {
      key: "settings",
      label: "Settings",
      icon: <HiOutlineCog6Tooth />,
      onPress: () => router.push("/settings"),
    },
    {
      key: "logout",
      label: "Log Out",
      icon: <HiArrowRightOnRectangle />,
      onPress: handleLogout,
    },
  ];

  return (
    <aside
      className={cn(
        "flex flex-col justify-between h-screen border-r-1 border-divider transition-all duration-300 ease-in-out",
        "w-16 md:w-64",
        { "md:w-16": !sidebarOpen },
      )}
    >
      <div className="grow">
        <div
          className={cn(
            "flex h-16 gap-2 items-center",
            sidebarOpen
              ? "justify-center md:justify-between"
              : "justify-center",
          )}
        >
          <div
            className={cn("transition-opacity duration-300 ml-4", {
              "opacity-100 hidden md:block": sidebarOpen,
              "opacity-0 w-0 hidden md:hidden": !sidebarOpen,
            })}
          >
            <CurioBrand />
          </div>
          <Button
            isIconOnly
            variant="light"
            onPress={toggleSidebar}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className={cn(
              "mt-2",
              sidebarOpen ? "hidden md:mr-2 md:flex" : "hidden md:flex",
            )}
          >
            <Icon icon={sidebarOpen ? <HiChevronLeft /> : <CurioLogo />} />
          </Button>
          <div className="block md:hidden mt-2 w-10 h-10">
            <Icon className="block md:hidden" icon={<CurioLogo />} />
          </div>
        </div>
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
              onSelectionChange={handleNavigation}
              aria-label="Navigation"
            >
              <Tab key={SidebarKey.NONE} className="hidden" />
              {navigationItems.map((item) => (
                <Tab
                  key={item.key}
                  title={
                    <div
                      className="flex items-center w-full h-full"
                      onClick={() => handleNavigation(item.key)}
                    >
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
                onPress={() => handleNavigation(item.key)}
                isSelected={selectedKey === item.key}
              />
            ))}
          </div>
        </nav>
      </div>
      <div className="flex-none">
        <div className={cn(sidebarOpen ? "hidden md:block" : "hidden")}>
          <Dropdown>
            <DropdownTrigger className="p-2">
              <Button
                variant="light"
                disableRipple
                className="justify-start w-full h-full"
              >
                <User name={user.username} description={user.email} />
              </Button>
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
    </aside>
  );
};

export default LeftSidebar;
