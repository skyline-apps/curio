import type { ImportJobsResponse } from "@app/schemas/v1/jobs/import";
import type { UpdateEmailResponse } from "@app/schemas/v1/user/email";
import type { GetLabelsResponse, Label } from "@app/schemas/v1/user/labels";
import type {
  GetSettingsResponse,
  UpdateSettingsRequest,
  UpdateSettingsResponse,
} from "@app/schemas/v1/user/settings";
import type { UpdateUsernameResponse } from "@app/schemas/v1/user/username";
import { createContext, useContext } from "react";

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
};

export const SettingsContext = createContext<SettingsContextType>({
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
});
export const useSettings = (): SettingsContextType =>
  useContext(SettingsContext);
