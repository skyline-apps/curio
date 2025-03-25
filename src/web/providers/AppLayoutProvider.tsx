"use client";
import {
  ShortcutType,
  useKeyboardShortcut,
} from "@web/providers/KeyboardShortcutProvider";
import {
  type AppLayoutSettings,
  DEFAULT_LAYOUT,
  loadLayoutSettings,
  updateLayoutSettings,
} from "@web/utils/displayStorage";
import { useRouter } from "next/navigation";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type AppLayoutContextType = {
  appLayout: AppLayoutSettings;
  updateAppLayout: (settings: Partial<AppLayoutSettings>) => void;
};

interface AppLayoutProviderProps {
  children: React.ReactNode;
}

export const AppLayoutContext = createContext<AppLayoutContextType>({
  appLayout: DEFAULT_LAYOUT,
  updateAppLayout: () => {},
});

export const AppLayoutProvider: React.FC<AppLayoutProviderProps> = ({
  children,
}: AppLayoutProviderProps): React.ReactNode => {
  const [appLayout, setAppLayout] = useState<AppLayoutSettings>(DEFAULT_LAYOUT);
  const router = useRouter();

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
    router.push("/home");
  }, [router]);

  const navigateInbox = useCallback(() => {
    router.push("/inbox");
  }, [router]);

  const navigateNotes = useCallback(() => {
    router.push("/notes");
  }, [router]);

  const navigateArchive = useCallback(() => {
    router.push("/archive");
  }, [router]);

  useKeyboardShortcut({
    key: "|",
    name: "Toggle sidebars",
    category: ShortcutType.DEFAULT,
    handler: toggleSidebars,
    priority: 100,
    conditions: {
      shiftKey: true,
    },
  });

  useKeyboardShortcut({
    key: "H",
    name: "Navigate to home",
    category: ShortcutType.DEFAULT,
    handler: navigateHome,
    priority: 100,
    conditions: {
      shiftKey: true,
    },
  });

  useKeyboardShortcut({
    key: "I",
    name: "Navigate to inbox",
    category: ShortcutType.DEFAULT,
    handler: navigateInbox,
    priority: 100,
    conditions: {
      shiftKey: true,
    },
  });

  useKeyboardShortcut({
    key: "N",
    name: "Navigate to notes",
    category: ShortcutType.DEFAULT,
    handler: navigateNotes,
    priority: 100,
    conditions: {
      shiftKey: true,
    },
  });

  useKeyboardShortcut({
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

export const useAppLayout = (): AppLayoutContextType =>
  useContext(AppLayoutContext);
