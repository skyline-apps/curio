"use client";
import { usePathname, useRouter } from "next/navigation";
import React, { useContext, useEffect, useState } from "react";
import { HiPlus } from "react-icons/hi2";

import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { useLogout } from "@/hooks/useLogout";
import { UserContext } from "@/providers/UserProvider";
import { cn } from "@/utils/cn";

import NavigationMenu, { SidebarKey } from "./NavigationMenu";
import SidebarHeader from "./SidebarHeader";
import UserMenu from "./UserMenu";

const LeftSidebar: React.FC = () => {
  const router = useRouter();
  const { user } = useContext(UserContext);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
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

  return (
    <aside
      className={cn(
        "flex flex-col justify-between h-screen border-r-1 border-divider transition-all duration-300 ease-in-out",
        "w-16 md:w-64",
        { "md:w-16": !sidebarOpen },
      )}
    >
      <div className="grow">
        <SidebarHeader sidebarOpen={sidebarOpen} onToggle={toggleSidebar} />
        <NavigationMenu
          sidebarOpen={sidebarOpen}
          selectedKey={selectedKey}
          onNavigation={handleNavigation}
        />
      </div>
      <Button
        className={cn("m-2 min-w-10", {
          "self-center": !sidebarOpen,
        })}
        isIconOnly={!sidebarOpen}
        onPress={
          () => null // TODO: Implement saving pages from app
        }
      >
        <Icon icon={<HiPlus />} />
        <span className="hidden md:block">{sidebarOpen && "Add new"}</span>
      </Button>
      <UserMenu
        user={user}
        sidebarOpen={sidebarOpen}
        selectedKey={selectedKey}
        onLogout={handleLogout}
        onNavigate={handleNavigation}
      />
    </aside>
  );
};

export default LeftSidebar;
