import {
  type AppLayoutSettings,
  DEFAULT_LAYOUT,
  loadLayoutSettings,
  updateLayoutSettings,
} from "@app/utils/displayStorage";
import {
  ShortcutType,
  useKeyboardShortcuts,
} from "providers/KeyboardShortcuts";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AppLayoutContext } from ".";

interface AppLayoutProviderProps {
  children: React.ReactNode;
}

export const AppLayoutProvider: React.FC<AppLayoutProviderProps> = ({
  children,
}: AppLayoutProviderProps): React.ReactNode => {
  const [appLayout, setAppLayout] = useState<AppLayoutSettings>(DEFAULT_LAYOUT);
  const navigate = useNavigate();

  useEffect(() => {
    setAppLayout(loadLayoutSettings());
  }, []);

  const updateAppLayout = useCallback(
    (settings: Partial<AppLayoutSettings>): void => {
      setAppLayout({ ...appLayout, ...settings });
      updateLayoutSettings({ ...appLayout, ...settings });
    },
    [appLayout],
  );

  const toggleSidebars = useCallback(() => {
    const current = appLayout.leftSidebarOpen;
    updateAppLayout({
      leftSidebarOpen: !current,
      rightSidebarOpen: !current,
    });
  }, [appLayout, updateAppLayout]);

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
      }}
    >
      {children}
    </AppLayoutContext.Provider>
  );
};
