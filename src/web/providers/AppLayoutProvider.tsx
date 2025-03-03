"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  type AppLayoutSettings,
  DEFAULT_LAYOUT,
  loadLayoutSettings,
  updateLayoutSettings,
} from "@/utils/displayStorage";

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
