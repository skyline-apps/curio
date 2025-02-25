"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { createContext, useContext, useEffect } from "react";

import type {
  CreateOrUpdateLabelsResponse,
  DeleteLabelsResponse,
  GetLabelsResponse,
} from "@/app/api/v1/user/labels/validation";
import type {
  SettingsResponse,
  UpdatedSettingsResponse,
} from "@/app/api/v1/user/settings/validation";
import { showConfirm } from "@/components/ui/Modal/Dialog";
import { useToast } from "@/providers/ToastProvider";
import { handleAPIResponse } from "@/utils/api";
import {
  initializeTheme,
  setDarkTheme,
  setLightTheme,
  setSystemTheme,
} from "@/utils/displayStorage";

export type SettingsContextType = {
  settings?: SettingsResponse;
  updateSettings: (
    field: keyof SettingsResponse,
    value: SettingsResponse[keyof SettingsResponse],
  ) => Promise<UpdatedSettingsResponse | void>;
  labels?: GetLabelsResponse["labels"];
  loadingLabels?: boolean;
  createLabel: (label: { name: string; color?: string }) => Promise<boolean>;
  updateLabel: (
    labelId: string,
    updates: { name?: string; color?: string },
  ) => Promise<boolean>;
  deleteLabel: (labelId: string) => Promise<void>;
};

interface SettingsProviderProps {
  children: React.ReactNode;
}

export const SettingsContext = createContext<SettingsContextType>({
  updateSettings: async () => {},
  createLabel: async () => true,
  updateLabel: async () => true,
  deleteLabel: async () => {},
});

const fetchSettings = async (): Promise<SettingsResponse> => {
  const response = await fetch("/api/v1/user/settings", {
    method: "GET",
  });
  return handleAPIResponse<SettingsResponse>(response);
};

const fetchLabels = async (): Promise<GetLabelsResponse> => {
  const response = await fetch("/api/v1/user/labels", {
    method: "GET",
  });
  return handleAPIResponse<GetLabelsResponse>(response);
};

enum LabelAction {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({
  children,
}: SettingsProviderProps): React.ReactNode => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: currentSettings } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
    retry: 1,
  });

  const { data: currentLabels, isPending: loadingLabels } = useQuery({
    queryKey: ["labels"],
    queryFn: fetchLabels,
    retry: 1,
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

  const labelsMutation = useMutation({
    mutationFn: async (payload: {
      type: LabelAction;
      label?: { name?: string; color?: string; id?: string };
    }) => {
      switch (payload.type) {
        case LabelAction.CREATE:
          const createResponse = await fetch("/api/v1/user/labels", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              labels: [
                { name: payload.label?.name, color: payload.label?.color },
              ],
            }),
          });
          return handleAPIResponse<CreateOrUpdateLabelsResponse>(
            createResponse,
          );

        case LabelAction.UPDATE:
          const updateResponse = await fetch("/api/v1/user/labels", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              labels: [
                {
                  id: payload.label?.id,
                  name: payload.label?.name,
                  color: payload.label?.color,
                },
              ],
            }),
          });
          return handleAPIResponse<CreateOrUpdateLabelsResponse>(
            updateResponse,
          );

        case LabelAction.DELETE:
          const deleteResponse = await fetch("/api/v1/user/labels", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: [payload.label?.id] }),
          });
          return handleAPIResponse<DeleteLabelsResponse>(deleteResponse);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labels"] });
    },
  });

  useEffect(() => {
    initializeTheme();
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
  ): Promise<UpdatedSettingsResponse | void> => {
    if (!currentSettings) {
      return;
    }
    return updateSettingsMutation.mutateAsync({ field, value });
  };

  const createLabel = async (label: {
    name: string;
    color?: string;
  }): Promise<boolean> => {
    try {
      await labelsMutation.mutateAsync({ type: LabelAction.CREATE, label });
      showToast("Label created successfully", { disappearing: true });
      return true;
    } catch (error: unknown) {
      showToast(
        error instanceof Error ? error.message : "Failed to create label",
        { type: "error" },
      );
      return false;
    }
  };

  const updateLabel = async (
    labelId: string,
    updates: { name?: string; color?: string },
  ): Promise<boolean> => {
    try {
      await labelsMutation.mutateAsync({
        type: LabelAction.UPDATE,
        label: { id: labelId, ...updates },
      });
      showToast("Label updated successfully", {
        disappearing: true,
      });
      return true;
    } catch (error) {
      showToast("Failed to update label", { type: "error" });
      return false;
    }
  };

  const deleteLabel = async (labelId: string): Promise<void> => {
    await showConfirm(
      "Are you sure you want to delete this label? This action cannot be undone.",
      async () => {
        try {
          await labelsMutation.mutateAsync({
            type: LabelAction.DELETE,
            label: { id: labelId },
          });

          showToast("Label deleted successfully", {
            disappearing: true,
          });

          return true;
        } catch (error) {
          showToast("Failed to delete label", {
            type: "error",
          });

          return false;
        }
      },
      "Delete",
    );
  };

  return (
    <SettingsContext.Provider
      value={{
        settings: currentSettings,
        updateSettings,
        labels: currentLabels?.labels,
        loadingLabels,
        createLabel,
        updateLabel,
        deleteLabel,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType =>
  useContext(SettingsContext);
