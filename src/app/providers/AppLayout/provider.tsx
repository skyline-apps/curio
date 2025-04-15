import {
  ShortcutType,
  useKeyboardShortcuts,
} from "@app/providers/KeyboardShortcuts";
import {
  type AppLayoutSettings,
  DEFAULT_LAYOUT,
  loadLayoutSettings,
  updateLayoutSettings,
} from "@app/utils/displayStorage";
import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { AppLayoutContext, SidebarKey } from ".";

interface AppLayoutProviderProps {
  children: React.ReactNode;
}

export const AppLayoutProvider: React.FC<AppLayoutProviderProps> = ({
  children,
}: AppLayoutProviderProps): React.ReactNode => {
  const [rootPage, setRootPage] = useState<SidebarKey>(SidebarKey.NONE);
  const [appLayout, setAppLayout] = useState<AppLayoutSettings>(DEFAULT_LAYOUT);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setAppLayout(loadLayoutSettings());
  }, []);

  const updateAppLayout = (settings: Partial<AppLayoutSettings>): void => {
    setAppLayout({ ...appLayout, ...settings });
    updateLayoutSettings({ ...appLayout, ...settings });
  };

  const updateRootPage = useCallback(
    (page: SidebarKey): void => {
      setRootPage(page);
    },
    [setRootPage],
  );

  const navigateToRoot = useCallback(() => {
    if (!pathname.startsWith(rootPage) && rootPage !== SidebarKey.NONE) {
      navigate(rootPage);
    }
  }, [navigate, rootPage, pathname]);

  const toggleSidebars = useCallback(() => {
    const current = appLayout.leftSidebarOpen;
    updateAppLayout({
      leftSidebarOpen: !current,
      rightSidebarOpen: !current,
    });
  }, [appLayout]); // eslint-disable-line react-hooks/exhaustive-deps

  const navigateHome = useCallback(() => {
    navigate("/home");
  }, [navigate]);

  const navigateInbox = useCallback(() => {
    navigate("/inbox");
  }, [navigate]);

  const navigateNotes = useCallback(() => {
    navigate("/notes");
  }, [navigate]);

  const navigateArchive = useCallback(() => {
    navigate("/archive");
  }, [navigate]);

  useKeyboardShortcuts({
    key: "|",
    name: "Toggle sidebars",
    category: ShortcutType.DEFAULT,
    handler: toggleSidebars,
    priority: 100,
    conditions: {
      shiftKey: true,
    },
  });

  useKeyboardShortcuts({
    key: "H",
    name: "Navigate to home",
    category: ShortcutType.DEFAULT,
    handler: navigateHome,
    priority: 100,
    conditions: {
      shiftKey: true,
    },
  });

  useKeyboardShortcuts({
    key: "I",
    name: "Navigate to inbox",
    category: ShortcutType.DEFAULT,
    handler: navigateInbox,
    priority: 100,
    conditions: {
      shiftKey: true,
    },
  });

  useKeyboardShortcuts({
    key: "N",
    name: "Navigate to notes",
    category: ShortcutType.DEFAULT,
    handler: navigateNotes,
    priority: 100,
    conditions: {
      shiftKey: true,
    },
  });

  useKeyboardShortcuts({
    key: "A",
    name: "Navigate to archive",
    category: ShortcutType.DEFAULT,
    handler: navigateArchive,
    priority: 100,
    conditions: {
      shiftKey: true,
    },
  });

  return (
    <AppLayoutContext.Provider
      value={{
        appLayout,
        updateAppLayout,
        updateRootPage,
        navigateToRoot,
      }}
    >
      {children}
    </AppLayoutContext.Provider>
  );
};
