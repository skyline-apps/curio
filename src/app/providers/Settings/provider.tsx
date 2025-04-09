import { showConfirm } from "@app/components/ui/Modal/actions";
import { useToast } from "@app/providers/Toast";
import { useUser } from "@app/providers/User";
import type {
  CreateOrUpdateLabelsResponse,
  DeleteLabelsResponse,
  GetLabelsResponse,
} from "@app/schemas/v1/user/labels";
import type {
  GetSettingsResponse,
  UpdateSettingsRequest,
  UpdateSettingsResponse,
} from "@app/schemas/v1/user/settings";
import { handleAPIResponse } from "@app/utils/api";
import {
  initializeTheme,
  setDarkTheme,
  setLightTheme,
  setSystemTheme,
} from "@app/utils/displayStorage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import posthog from "posthog-js";
import React, { useEffect } from "react";

import { SettingsContext } from ".";

interface SettingsProviderProps {
  children: React.ReactNode;
}

const fetchSettings = async (): Promise<GetSettingsResponse> => {
  const response = await fetch("/api/v1/user/settings", {
    method: "GET",
  });
  return handleAPIResponse<GetSettingsResponse>(response);
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
  const { user } = useUser();
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
      field: keyof UpdateSettingsRequest;
      value: UpdateSettingsRequest[keyof UpdateSettingsRequest];
    }) => {
      const response = await fetch("/api/v1/user/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [payload.field]: payload.value }),
      });
      return handleAPIResponse<UpdateSettingsResponse>(response);
    },
    onSuccess: (result) => {
      queryClient.setQueryData<GetSettingsResponse>(
        ["settings"],
        (oldData: GetSettingsResponse | undefined) => {
          return oldData ? { ...oldData, ...result } : undefined;
        },
      );
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

  useEffect(() => {
    if (!currentSettings) {
      return;
    }
    if (currentSettings.analyticsTracking && user.id) {
      posthog.opt_in_capturing();
      posthog.identify(user.id, {
        username: user.username,
        email: user.email,
      });
    } else {
      posthog.opt_out_capturing();
    }
  }, [currentSettings?.analyticsTracking, user.id, user.username]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateSettings = async (
    field: keyof UpdateSettingsRequest,
    value: UpdateSettingsRequest[keyof UpdateSettingsRequest],
  ): Promise<UpdateSettingsResponse | void> => {
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
    } catch (_error) {
      showToast("Failed to update label", { type: "error" });
      return false;
    }
  };

  const deleteLabel = async (labelId: string): Promise<void> => {
    showConfirm(
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
        } catch (_error) {
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
