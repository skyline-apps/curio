"use client";
import React, { createContext, useEffect, useState } from "react";

import type {
  SettingsResponse,
  UpdatedSettingsResponse,
} from "@/app/api/v1/user/settings/validation";
import { handleAPIResponse } from "@/utils/api";
import { createLogger } from "@/utils/logger";
import {
  initializeTheme,
  setDarkTheme,
  setLightTheme,
  setSystemTheme,
} from "@/utils/themeStorage";

const log = createLogger("SettingsProvider");

export type SettingsContextType = {
  settings?: SettingsResponse;
  updateSettings: (
    field: keyof SettingsResponse,
    value: SettingsResponse[keyof SettingsResponse],
  ) => Promise<SettingsResponse | void>;
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
  const [currentSettings, setCurrentSettings] = useState<SettingsResponse>();

  const fetchSettings = async (): Promise<void> => {
    fetch("/api/v1/user/settings", {
      method: "GET",
    })
      .then(handleAPIResponse<SettingsResponse>)
      .then((result) => {
        setCurrentSettings(result);
      })
      .catch((error) => {
        if (error.message.match(/unauthorized/i)) {
          setCurrentSettings(undefined);
        } else {
          log.error("Error getting settings: ", error);
        }
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
    field: keyof SettingsResponse,
    value: SettingsResponse[keyof SettingsResponse],
  ): Promise<SettingsResponse | void> => {
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
      .then(handleAPIResponse<UpdatedSettingsResponse>)
      .then((result) => {
        const newSettings = { ...currentSettings, ...result };
        setCurrentSettings(newSettings);
        return newSettings;
      });
  };

  return (
    <SettingsContext.Provider
      value={{
        settings: currentSettings,
        updateSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
