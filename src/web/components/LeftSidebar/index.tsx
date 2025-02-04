"use client";
import { usePathname, useRouter } from "next/navigation";
import React, { useContext, useEffect, useState } from "react";
import {
  HiChevronDoubleLeft,
  HiChevronDoubleRight,
  HiPlus,
} from "react-icons/hi2";

import NewItemModal from "@/components/NewItemModal";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { useLogout } from "@/hooks/useLogout";
import {
  BrowserMessageContext,
  EventType,
} from "@/providers/BrowserMessageProvider";
import { SettingsContext } from "@/providers/SettingsProvider";
import { UserContext } from "@/providers/UserProvider";
import { cn } from "@/utils/cn";

import NavigationMenu, { SidebarKey } from "./NavigationMenu";
import SidebarHeader from "./SidebarHeader";
import UserMenu from "./UserMenu";

const LeftSidebar: React.FC = () => {
  const router = useRouter();
  const { user } = useContext(UserContext);
  const pathname = usePathname();
  const [selectedKey, setSelectedKey] = useState<string>(SidebarKey.NONE);
  const [showNewItemModal, setShowNewItemModal] = useState<boolean>(false);
  const { appLayout, updateAppLayout } = useContext(SettingsContext);
  const { addMessageListener, removeMessageListener } = useContext(
    BrowserMessageContext,
  );

  const handleLogout = useLogout();

  useEffect(() => {
    const handleMessage = (event: MessageEvent): void => {
      if (event.data.type === EventType.SAVE_SUCCESS) {
        setShowNewItemModal(false);
      }
    };

    addMessageListener(handleMessage);
    return () => removeMessageListener(handleMessage);
  }, [addMessageListener, removeMessageListener]);

  useEffect(() => {
    const newSelectedKey = Object.values(SidebarKey).includes(
      pathname as SidebarKey,
    )
      ? pathname
      : SidebarKey.NONE;
    setSelectedKey(newSelectedKey);
  }, [pathname]);

  if (!appLayout) {
    return null;
  }

  const sidebarOpen = appLayout.leftSidebarOpen;

  const handleNavigation = (key: React.Key): void => {
    router.push(key.toString());
  };

  const toggleSidebar = (): void => {
    updateAppLayout({
      ...appLayout,
      leftSidebarOpen: !sidebarOpen,
    });
  };

  return (
    <>
      <aside
        className={cn(
          "flex flex-col justify-between h-screen border-r-1 border-divider transition-all duration-300 ease-in-out",
          "w-16 md:w-64",
          { "overflow-hidden w-0 md:w-16": !sidebarOpen },
        )}
      >
        <div className="grow">
          <SidebarHeader sidebarOpen={sidebarOpen} />
          <NavigationMenu
            sidebarOpen={sidebarOpen}
            selectedKey={selectedKey}
            onNavigation={handleNavigation}
          />
        </div>
        <Button
          className={cn("m-2 min-w-10", {
            "self-center": !sidebarOpen,
            "hidden md:flex": !sidebarOpen,
          })}
          isIconOnly={!sidebarOpen}
          onPress={() => setShowNewItemModal(true)}
        >
          <Icon icon={<HiPlus />} />
          <span className="hidden md:block">{sidebarOpen && "Add new"}</span>
        </Button>
        <div
          className={cn(
            "flex items-center",
            sidebarOpen ? "flex-col md:flex-row gap-2" : "flex-col",
          )}
        >
          <UserMenu
            user={user}
            sidebarOpen={sidebarOpen}
            selectedKey={selectedKey}
            onLogout={handleLogout}
            onNavigate={handleNavigation}
          />
          <Button
            isIconOnly
            variant="faded"
            onPress={toggleSidebar}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className={cn(
              "flex-none w-10 z-10 m-2",
              sidebarOpen ? "" : "absolute left-0 bottom-0 md:relative",
            )}
          >
            <Icon
              icon={
                sidebarOpen ? <HiChevronDoubleLeft /> : <HiChevronDoubleRight />
              }
            />
          </Button>
        </div>
      </aside>
      <NewItemModal
        isOpen={showNewItemModal}
        onClose={() => setShowNewItemModal(false)}
      />
    </>
  );
};

export default LeftSidebar;
