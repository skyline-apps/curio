import NewItemModal from "@app/components/NewItemModal";
import Button from "@app/components/ui/Button";
import Icon from "@app/components/ui/Icon";
import { useAppLayout } from "@app/providers/AppLayout";
import {
  BrowserMessageContext,
  EventType,
} from "@app/providers/BrowserMessage";
import { useUser } from "@app/providers/User";
import { cn } from "@app/utils/cn";
import React, { useContext, useEffect, useState } from "react";
import {
  HiChevronDoubleLeft,
  HiChevronDoubleRight,
  HiPlus,
} from "react-icons/hi2";
import { useLocation, useNavigate } from "react-router-dom";

import NavigationMenu from "./NavigationMenu";
import SidebarHeader from "./SidebarHeader";
import { SidebarKey } from "./types";
import UserMenu from "./UserMenu";

const LeftSidebar: React.FC = () => {
  const { user, handleLogout } = useUser();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [selectedKey, setSelectedKey] = useState<string>(SidebarKey.NONE);
  const [showNewItemModal, setShowNewItemModal] = useState<boolean>(false);
  const { appLayout, updateAppLayout } = useAppLayout();
  const { addMessageListener, removeMessageListener } = useContext(
    BrowserMessageContext,
  );

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

  const sidebarOpen = appLayout.leftSidebarOpen;

  const handleNavigation = (key: React.Key): void => {
    navigate(key.toString());
  };

  const toggleSidebar = (): void => {
    updateAppLayout({
      leftSidebarOpen: !sidebarOpen,
    });
  };

  return (
    <>
      <aside
        className={cn(
          "flex flex-col justify-between h-dvh border-r-1 border-divider transition-all duration-300 ease-in-out",
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
