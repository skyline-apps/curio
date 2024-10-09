"use client";
import React, { createContext, useEffect, useState } from "react";

import type {
  Settings,
  UpdatedSettings,
} from "@/app/api/v1/user/settings/validation";
import { ColorScheme } from "@/db/schema";
import { handleAPIResponse } from "@/utils/api";
import { createLogger } from "@/utils/logger";
import {
  initializeTheme,
  setDarkTheme,
  setLightTheme,
  setSystemTheme,
} from "@/utils/theme";

const log = createLogger("SettingsProvider");

export type SettingsContextType = {
  settings?: Settings;
  updateSettings: (
    field: keyof Settings,
    value: Settings[keyof Settings],
  ) => Promise<Settings | void>;
  getActualColorScheme: () => ColorScheme;
};

interface SettingsProviderProps {
  children: React.ReactNode;
}

export const SettingsContext = createContext<SettingsContextType>({
  updateSettings: async () => {},
  getActualColorScheme: () => ColorScheme.AUTO,
});

export const SettingsProvider: React.FC<SettingsProviderProps> = ({
  children,
}: SettingsProviderProps): React.ReactNode => {
  const [currentSettings, setCurrentSettings] = useState<Settings>();

  const fetchSettings = async (): Promise<void> => {
    fetch("/api/v1/user/settings", {
      method: "GET",
    })
      .then(handleAPIResponse<Settings>)
      .then((result) => {
        setCurrentSettings(result);
      })
      .catch((error) => {
        log.error("Error getting settings: ", error);
      });
  };

  useEffect(() => {
    initializeTheme();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (currentSettings?.colorScheme) {
      if (currentSettings.colorScheme === "auto") {
        setSystemTheme();
      } else if (currentSettings.colorScheme === "light") {
        setLightTheme();
      } else if (currentSettings.colorScheme === "dark") {
        setDarkTheme();
      }
    }
  }, [currentSettings?.colorScheme]);

  const updateSettings = async (
    field: keyof Settings,
    value: Settings[keyof Settings],
  ): Promise<Settings | void> => {
    if (!currentSettings) {
      return;
    }
    return fetch("/api/v1/user/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ [field]: value }),
    })
      .then(handleAPIResponse<UpdatedSettings>)
      .then((result) => {
        const newSettings = { ...currentSettings, ...result };
        setCurrentSettings(newSettings);
        return newSettings;
      });
  };

  const getActualColorScheme = (): ColorScheme => {
    if (!currentSettings) {
      return ColorScheme.AUTO;
    }
    if (currentSettings.colorScheme === ColorScheme.AUTO) {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return ColorScheme.DARK;
      } else {
        return ColorScheme.LIGHT;
      }
    } else {
      return currentSettings.colorScheme;
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings: currentSettings,
        updateSettings,
        getActualColorScheme,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
