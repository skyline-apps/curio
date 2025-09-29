import NewItemModal from "@app/components/NewItemModal";
import Button from "@app/components/ui/Button";
import Icon from "@app/components/ui/Icon";
import { SidebarKey, useAppLayout } from "@app/providers/AppLayout";
import { useSettings } from "@app/providers/Settings";
import { useUser } from "@app/providers/User";
import { cn } from "@app/utils/cn";
import React, { useEffect, useState } from "react";
import { HiPlus } from "react-icons/hi2";
import { useLocation, useNavigate } from "react-router-dom";

import LeftSidebar from "./index";
import NavigationMenu from "./NavigationMenu";
import SidebarHeader from "./SidebarHeader";
import UserMenu from "./UserMenu";

const AppLeftSidebar: React.FC = () => {
  const { user, handleLogout } = useUser();
  const { username } = useSettings();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [selectedKey, setSelectedKey] = useState<SidebarKey>(SidebarKey.NONE);
  const [showNewItemModal, setShowNewItemModal] = useState<boolean>(false);
  const { appLayout, updateRootPage } = useAppLayout();

  useEffect(() => {
    const newSelectedKey =
      Object.values(SidebarKey).find(
        (key) => !!key && pathname.startsWith(key),
      ) ?? SidebarKey.NONE;
    setSelectedKey(newSelectedKey);
    if (!!newSelectedKey) {
      updateRootPage(toNavigationKey(newSelectedKey));
    }
  }, [pathname, updateRootPage]);

  const sidebarOpen = appLayout.leftSidebarOpen;

  const handleNavigation = (key: React.Key): void => {
    navigate(key.toString());
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

  const content = (
    <div className="flex-1">
      <SidebarHeader sidebarOpen={sidebarOpen} />
      <NavigationMenu
        sidebarOpen={sidebarOpen}
        selectedKey={toNavigationKey(selectedKey)}
        onNavigation={handleNavigation}
      />
    </div>
  );

  const endContent = (
    <div className="flex flex-col overflow-hidden">
      <Button
        id="new-item"
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
    </div>
  );

  const bottomContent = (
    <UserMenu
      username={username}
      email={user.email}
      sidebarOpen={sidebarOpen}
      selectedKey={selectedKey}
      onLogout={handleLogout}
      onNavigate={handleNavigation}
    />
  );

  return (
    <>
      <LeftSidebar
        content={content}
        endContent={endContent}
        bottomContent={bottomContent}
      />
      <NewItemModal
        isOpen={showNewItemModal}
        onClose={() => setShowNewItemModal(false)}
      />
    </>
  );
};

export default AppLeftSidebar;
