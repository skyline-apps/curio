import NewItemModal from "@app/components/NewItemModal";
import Button from "@app/components/ui/Button";
import Icon from "@app/components/ui/Icon";
import { SidebarKey, useAppLayout } from "@app/providers/AppLayout";
import { useSidebarSwipe } from "@app/providers/AppLayout/useSidebarSwipe";
import {
  BrowserMessageContext,
  EventType,
} from "@app/providers/BrowserMessage";
import { useSettings } from "@app/providers/Settings";
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
import UserMenu from "./UserMenu";

const LeftSidebar: React.FC = () => {
  const { user, handleLogout } = useUser();
  const { username } = useSettings();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [selectedKey, setSelectedKey] = useState<SidebarKey>(SidebarKey.NONE);
  const [showNewItemModal, setShowNewItemModal] = useState<boolean>(false);
  const { appLayout, updateAppLayout, updateRootPage } = useAppLayout();
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
    const newSelectedKey =
      Object.values(SidebarKey).find(
        (key) => !!key && pathname.startsWith(key),
      ) ?? SidebarKey.NONE;
    setSelectedKey(newSelectedKey);
    if (newSelectedKey !== SidebarKey.NONE) {
      updateRootPage(newSelectedKey);
    }
  }, [pathname, updateRootPage]);

  const sidebarOpen = appLayout.leftSidebarOpen;

  const handleNavigation = (key: React.Key): void => {
    navigate(key.toString());
  };

  const toggleSidebar = (): void => {
    updateAppLayout({
      leftSidebarOpen: !sidebarOpen,
    });
  };

  const toNavigationKey = (key: SidebarKey): SidebarKey => {
    return [
      SidebarKey.HOME,
      SidebarKey.INBOX,
      SidebarKey.NOTES,
      SidebarKey.ARCHIVE,
    ].includes(key)
      ? key
      : SidebarKey.NONE;
  };

  const bind = useSidebarSwipe({
    isOpen: sidebarOpen,
    onOpen: () => updateAppLayout({ leftSidebarOpen: true }),
    onClose: () => updateAppLayout({ leftSidebarOpen: false }),
    side: "left",
  });

  return (
    <>
      <aside
        {...bind()}
        className={cn(
          "flex flex-col justify-between h-dvh border-r-1 border-divider transition-all duration-300 ease-in-out",
          "w-16 md:w-64",
          { "overflow-hidden w-0 md:w-16": !sidebarOpen },
        )}
      >
        <div className="flex-1">
          <SidebarHeader sidebarOpen={sidebarOpen} />
          <NavigationMenu
            sidebarOpen={sidebarOpen}
            selectedKey={toNavigationKey(selectedKey)}
            onNavigation={handleNavigation}
          />
        </div>
        <div className="flex flex-col overflow-y-hidden">
          <Button
            className={cn("m-2 shrink min-h-8 min-w-10", {
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
              "flex items-center min-h-12 justify-end overflow-y-hidden",
              sidebarOpen ? "flex-col md:flex-row gap-2" : "flex-col",
            )}
          >
            <UserMenu
              username={username}
              email={user.email}
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
                  sidebarOpen ? (
                    <HiChevronDoubleLeft />
                  ) : (
                    <HiChevronDoubleRight />
                  )
                }
              />
            </Button>
          </div>
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
