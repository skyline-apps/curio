"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { createContext, useEffect, useState } from "react";

import type {
  SettingsResponse,
  UpdatedSettingsResponse,
} from "@/app/api/v1/user/settings/validation";
import { handleAPIResponse } from "@/utils/api";
import {
  type AppLayoutSettings,
  initializeTheme,
  loadLayoutSettings,
  setDarkTheme,
  setLightTheme,
  setSystemTheme,
  updateLayoutSettings,
} from "@/utils/displayStorage";

export type SettingsContextType = {
  appLayout?: AppLayoutSettings;
  updateAppLayout: (settings: AppLayoutSettings) => void;
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
  updateAppLayout: () => {},
  updateSettings: async () => {},
});

const fetchSettings = async (): Promise<SettingsResponse> => {
  const response = await fetch("/api/v1/user/settings", {
    method: "GET",
  });
  return handleAPIResponse<SettingsResponse>(response);
};

export const SettingsProvider: React.FC<SettingsProviderProps> = ({
  children,
}: SettingsProviderProps): React.ReactNode => {
  const queryClient = useQueryClient();
  const [appLayout, setAppLayout] = useState<AppLayoutSettings>();

  const { data: currentSettings } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (payload: {
      field: keyof SettingsResponse;
      value: SettingsResponse[keyof SettingsResponse];
    }) => {
      const response = await fetch("/api/v1/user/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [payload.field]: payload.value }),
      });
      return handleAPIResponse<UpdatedSettingsResponse>(response);
    },
    onSuccess: (result) => {
      queryClient.setQueryData<SettingsResponse>(["settings"], (oldData) => {
        return oldData ? { ...oldData, ...result } : undefined;
      });
    },
  });

  useEffect(() => {
    initializeTheme();
    setAppLayout(loadLayoutSettings());
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

  const updateAppLayout = (settings: AppLayoutSettings): void => {
    setAppLayout(settings);
    updateLayoutSettings(settings);
  };

  const updateSettings = async (
    field: keyof SettingsResponse,
    value: SettingsResponse[keyof SettingsResponse],
  ): Promise<SettingsResponse | void> => {
    if (!currentSettings) {
      return;
    }
    return updateSettingsMutation.mutateAsync({ field, value });
  };

  return (
    <SettingsContext.Provider
      value={{
        settings: currentSettings,
        updateSettings,
        appLayout,
        updateAppLayout,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
