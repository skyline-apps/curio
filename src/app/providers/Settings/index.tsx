import type { ImportJobsResponse } from "@app/schemas/v1/jobs/import";
import type { UpdateEmailResponse } from "@app/schemas/v1/user/email";
import type { GetLabelsResponse, Label } from "@app/schemas/v1/user/labels";
import type {
  GetSettingsResponse,
  UpdateSettingsRequest,
  UpdateSettingsResponse,
} from "@app/schemas/v1/user/settings";
import type { UpdateUsernameResponse } from "@app/schemas/v1/user/username";
import {
  DEFAULT_SWIPE_SETTINGS,
  loadSwipeSettings,
  SWIPE_SETTINGS_STORAGE_KEY,
  type SwipeSettings,
  updateSwipeSettings as saveSwipeSettings,
} from "@app/utils/displayStorage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type SettingsContextType = {
  username: string;
  refreshProfile: () => Promise<void>;
  newsletterEmail: string | null;
  changeUsername: (username: string) => Promise<UpdateUsernameResponse | void>;
  updateNewsletterEmail: () => Promise<UpdateEmailResponse | void>;
  importJobs: ImportJobsResponse["jobs"];
  isLoadingImportJobs: boolean;
  loadImportJobs: (reload?: boolean) => void;
  settings?: GetSettingsResponse;
  updateSettings: (
    field: keyof UpdateSettingsRequest,
    value: UpdateSettingsRequest[keyof UpdateSettingsRequest],
  ) => Promise<UpdateSettingsResponse | void>;
  labels?: GetLabelsResponse["labels"];
  loadingLabels?: boolean;
  createLabel: (label: {
    name: string;
    color?: string;
  }) => Promise<Label | void>;
  updateLabel: (
    labelId: string,
    updates: { name?: string; color?: string },
  ) => Promise<boolean>;
  deleteLabel: (labelId: string) => Promise<void>;
  isPremium: boolean;
  shouldShowUpgradeBanner: boolean;
  dismissUpgradeBanner: () => Promise<void>;
  swipeSettings: SwipeSettings;
  updateSwipeSettings: (settings: Partial<SwipeSettings>) => void;
};

export const DEFAULT_SETTINGS_CONTEXT: SettingsContextType = {
  username: "",
  refreshProfile: () => Promise.resolve(),
  newsletterEmail: null,
  changeUsername: (_username: string) => Promise.resolve(),
  updateNewsletterEmail: () => Promise.resolve(),
  importJobs: [],
  isLoadingImportJobs: false,
  loadImportJobs: () => {},
  updateSettings: async () => {},
  createLabel: async () => {},
  updateLabel: async () => true,
  deleteLabel: async () => {},
  isPremium: false,
  shouldShowUpgradeBanner: false,
  dismissUpgradeBanner: async () => {},
  swipeSettings: DEFAULT_SWIPE_SETTINGS,
  updateSwipeSettings: () => {},
};

export const SettingsContext = createContext<SettingsContextType>(
  DEFAULT_SETTINGS_CONTEXT,
);
export const useSettings = (): SettingsContextType =>
  useContext(SettingsContext);

export const SWIPE_SETTINGS_CHANGE_EVENT = "curio_swipe_settings_changed";

export const useSwipeSettings = (): {
  swipeSettings: SwipeSettings;
  updateSwipeSettings: (settings: Partial<SwipeSettings>) => void;
} => {
  const context = useContext(SettingsContext);
  const isInsideCustomProvider =
    context !== null && context !== DEFAULT_SETTINGS_CONTEXT;

  const [standaloneSettings, setStandaloneSettings] = useState<SwipeSettings>(
    () => loadSwipeSettings(),
  );

  useEffect(() => {
    if (isInsideCustomProvider) {
      return;
    }

    const handleUpdate = (): void => {
      setStandaloneSettings(loadSwipeSettings());
    };

    const handleStorage = (e: StorageEvent): void => {
      if (e.key === SWIPE_SETTINGS_STORAGE_KEY || e.key === "curio_settings") {
        handleUpdate();
      }
    };

    window.addEventListener(SWIPE_SETTINGS_CHANGE_EVENT, handleUpdate);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(SWIPE_SETTINGS_CHANGE_EVENT, handleUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, [isInsideCustomProvider]);

  const standaloneUpdate = useCallback(
    (settings: Partial<SwipeSettings>): void => {
      saveSwipeSettings(settings);
      setStandaloneSettings(loadSwipeSettings());
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(SWIPE_SETTINGS_CHANGE_EVENT));
      }
    },
    [],
  );

  if (isInsideCustomProvider) {
    return {
      swipeSettings: context.swipeSettings,
      updateSwipeSettings: (settings: Partial<SwipeSettings>) => {
        context.updateSwipeSettings(settings);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent(SWIPE_SETTINGS_CHANGE_EVENT));
        }
      },
    };
  }

  return {
    swipeSettings: standaloneSettings,
    updateSwipeSettings: standaloneUpdate,
  };
};
