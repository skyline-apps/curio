import { showConfirm } from "@app/components/ui/Modal/actions";
import { useToast } from "@app/providers/Toast";
import { useUser } from "@app/providers/User";
import type { ImportJobsResponse } from "@app/schemas/v1/jobs/import";
import type { GetUserResponse } from "@app/schemas/v1/user";
import { type UpdateEmailResponse } from "@app/schemas/v1/user/email";
import type {
  CreateOrUpdateLabelsResponse,
  DeleteLabelsResponse,
  GetLabelsResponse,
  Label,
} from "@app/schemas/v1/user/labels";
import type {
  GetSettingsResponse,
  UpdateSettingsRequest,
  UpdateSettingsResponse,
} from "@app/schemas/v1/user/settings";
import { type UpdateUsernameResponse } from "@app/schemas/v1/user/username";
import { authenticatedFetch, handleAPIResponse } from "@app/utils/api";
import {
  initializeTheme,
  setDarkTheme,
  setLightTheme,
  setSystemTheme,
} from "@app/utils/displayStorage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import posthog from "posthog-js";
import React, { useCallback, useEffect } from "react";

import { SettingsContext } from ".";

interface SettingsProviderProps {
  children: React.ReactNode;
}

const fetchProfile = async (): Promise<GetUserResponse> => {
  const response = await authenticatedFetch("/api/v1/user", {
    method: "GET",
  });
  return handleAPIResponse<GetUserResponse>(response);
};

const fetchSettings = async (): Promise<GetSettingsResponse> => {
  const response = await authenticatedFetch("/api/v1/user/settings", {
    method: "GET",
  });
  return handleAPIResponse<GetSettingsResponse>(response);
};

const fetchImportJobs = async (): Promise<ImportJobsResponse> => {
  const response = await authenticatedFetch("/api/v1/jobs/import", {
    method: "GET",
  });
  return handleAPIResponse<ImportJobsResponse>(response);
};

const fetchLabels = async (): Promise<GetLabelsResponse> => {
  const response = await authenticatedFetch("/api/v1/user/labels", {
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

  const { data: currentProfile, refetch: loadProfile } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    retry: 1,
    enabled: !!user.id,
  });

  const { data: currentSettings, refetch: loadSettings } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
    retry: 1,
    enabled: !!user.id,
  });

  const {
    data: currentImportJobs,
    refetch: refetchImportJobs,
    isFetching: isLoadingImportJobs,
  } = useQuery({
    queryKey: ["importJobs"],
    queryFn: fetchImportJobs,
    retry: 1,
    enabled: !!user.id,
  });

  const {
    data: currentLabels,
    isPending: loadingLabels,
    refetch: loadLabels,
  } = useQuery({
    queryKey: ["labels"],
    queryFn: fetchLabels,
    retry: 1,
    enabled: !!user.id,
  });

  const loadImportJobs = useCallback(
    (reload: boolean = false) => {
      refetchImportJobs().catch((error) => {
        if (reload) {
          showToast(
            error instanceof Error
              ? error.message
              : "Failed to load import jobs",
            { type: "error" },
          );
        }
      });
    },
    [refetchImportJobs, showToast],
  );

  const changeUsernameMutation = useMutation({
    mutationFn: async (username: string) => {
      const response = await authenticatedFetch("/api/v1/user/username", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id, username: username }),
      });
      return handleAPIResponse<UpdateUsernameResponse>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: () => {
      showToast("Failed to update username", { type: "error" });
    },
  });

  const updateNewsletterEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await authenticatedFetch("/api/v1/user/email", {
        method: "POST",
      });
      return handleAPIResponse<UpdateEmailResponse>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: () => {
      showToast("Failed to update newsletter email", { type: "error" });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (payload: {
      field: keyof UpdateSettingsRequest;
      value: UpdateSettingsRequest[keyof UpdateSettingsRequest];
    }) => {
      const response = await authenticatedFetch("/api/v1/user/settings", {
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
          const createResponse = await authenticatedFetch(
            "/api/v1/user/labels",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                labels: [
                  { name: payload.label?.name, color: payload.label?.color },
                ],
              }),
            },
          );
          return handleAPIResponse<CreateOrUpdateLabelsResponse>(
            createResponse,
          );

        case LabelAction.UPDATE:
          const updateResponse = await authenticatedFetch(
            "/api/v1/user/labels",
            {
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
            },
          );
          return handleAPIResponse<CreateOrUpdateLabelsResponse>(
            updateResponse,
          );

        case LabelAction.DELETE:
          const deleteResponse = await authenticatedFetch(
            "/api/v1/user/labels",
            {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ids: [payload.label?.id] }),
            },
          );
          return handleAPIResponse<DeleteLabelsResponse>(deleteResponse);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labels"] });
    },
  });

  useEffect(() => {
    if (user.id) {
      loadProfile();
      loadSettings();
      loadLabels();
    }
    initializeTheme();
  }, [user.id, loadSettings, loadLabels, loadProfile]);

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
    if (
      currentSettings.analyticsTracking &&
      user.id &&
      currentProfile?.username
    ) {
      posthog.opt_in_capturing();
      posthog.identify(user.id, {
        username: currentProfile.username,
        email: user.email,
      });
    } else {
      posthog.opt_out_capturing();
    }
  }, [currentSettings?.analyticsTracking, user.id, currentProfile?.username]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeUsername = async (
    username: string,
  ): Promise<UpdateUsernameResponse | void> => {
    return changeUsernameMutation.mutateAsync(username);
  };

  const updateNewsletterEmail =
    async (): Promise<UpdateEmailResponse | void> => {
      return updateNewsletterEmailMutation.mutateAsync();
    };

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
  }): Promise<Label | void> => {
    try {
      const newLabel = (await labelsMutation.mutateAsync({
        type: LabelAction.CREATE,
        label,
      })) as CreateOrUpdateLabelsResponse;
      if (!newLabel || !newLabel.labels || newLabel.labels.length !== 1) {
        return;
      }
      showToast("Label created successfully", { disappearing: true });
      return newLabel.labels[0];
    } catch (error: unknown) {
      showToast(
        error instanceof Error ? error.message : "Failed to create label",
        { type: "error" },
      );
      return;
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
        username: currentProfile?.username ?? "",
        newsletterEmail: currentProfile?.newsletterEmail ?? null,
        changeUsername,
        updateNewsletterEmail,
        importJobs: currentImportJobs?.jobs ?? [],
        isLoadingImportJobs,
        loadImportJobs,
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
