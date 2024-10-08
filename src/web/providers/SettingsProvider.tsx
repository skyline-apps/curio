"use client";
import { useTheme } from "next-themes";
import React, { createContext, useEffect, useState } from "react";

import type {
  Settings,
  UpdatedSettings,
} from "@/app/api/v1/user/settings/validation";
import { ColorScheme } from "@/db/schema";
import { handleAPIResponse } from "@/utils/api";
import { createLogger } from "@/utils/logger";

const log = createLogger("SettingsProvider");

export type SettingsContextType = {
  settings?: Settings;
  updateSettings: (
    field: keyof Settings,
    value: Settings[keyof Settings],
  ) => Promise<Settings | void>;
};

interface SettingsProviderProps {
  children: React.ReactNode;
}

export const SettingsContext = createContext<SettingsContextType>({
  updateSettings: async () => {},
});

export const SettingsProvider: React.FC<SettingsProviderProps> = ({
  children,
}: SettingsProviderProps): React.ReactNode => {
  const [currentSettings, setCurrentSettings] = useState<Settings>();
  const { setTheme } = useTheme();

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
    fetchSettings();
  }, []);

  useEffect(() => {
    if (currentSettings?.colorScheme) {
      if (currentSettings.colorScheme === ColorScheme.AUTO) {
        setTheme("system");
      } else if (currentSettings.colorScheme === ColorScheme.LIGHT) {
        setTheme("light");
      } else if (currentSettings.colorScheme === ColorScheme.DARK) {
        setTheme("dark");
      }
    }
  }, [currentSettings?.colorScheme, setTheme]);

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

  return (
    <SettingsContext.Provider
      value={{ settings: currentSettings, updateSettings }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
