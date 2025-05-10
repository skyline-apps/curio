import {
  ShortcutType,
  useKeyboardShortcuts,
} from "@app/providers/KeyboardShortcuts";
import {
  type AppLayoutSettings,
  DEFAULT_LAYOUT,
  getStoredRootPage,
  loadLayoutSettings,
  storeRootPage,
  updateLayoutSettings,
} from "@app/utils/displayStorage";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
    const stored = getStoredRootPage();
    if (stored) {
      setRootPage(stored as SidebarKey);
    }
  }, []);

  const updateAppLayout = useCallback(
    (settings: Partial<AppLayoutSettings>): void => {
      setAppLayout((prevLayout) => {
        const newLayout = { ...prevLayout, ...settings };
        updateLayoutSettings(newLayout);
        return newLayout;
      });
    },
    [],
  );

  const updateRootPage = useCallback((page: SidebarKey): void => {
    setRootPage(page);
    storeRootPage(page);
  }, []);

  const navigateToRoot = useCallback(() => {
    if (!pathname.startsWith(rootPage) && rootPage !== SidebarKey.NONE) {
      navigate(rootPage);
    }
  }, [navigate, rootPage, pathname]);

  const toggleSidebars = useCallback(() => {
    // Read the current value from the state
    const currentIsOpen = appLayout.leftSidebarOpen;
    updateAppLayout({
      leftSidebarOpen: !currentIsOpen,
      rightSidebarOpen: !currentIsOpen,
    });
  }, [appLayout.leftSidebarOpen, updateAppLayout]);

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

  const contextValue = useMemo(() => {
    return {
      appLayout,
      updateAppLayout,
      updateRootPage,
      navigateToRoot,
    };
  }, [appLayout, updateAppLayout, updateRootPage, navigateToRoot]);

  return (
    <AppLayoutContext.Provider value={contextValue}>
      {children}
    </AppLayoutContext.Provider>
  );
};
