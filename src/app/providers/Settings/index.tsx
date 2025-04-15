import type { UpdateEmailResponse } from "@app/schemas/v1/user/email";
import type { GetLabelsResponse } from "@app/schemas/v1/user/labels";
import type {
  GetSettingsResponse,
  UpdateSettingsRequest,
  UpdateSettingsResponse,
} from "@app/schemas/v1/user/settings";
import type { UpdateUsernameResponse } from "@app/schemas/v1/user/username";
import { createContext, useContext } from "react";

export type SettingsContextType = {
  username: string;
  newsletterEmail: string | null;
  changeUsername: (username: string) => Promise<UpdateUsernameResponse | void>;
  updateNewsletterEmail: () => Promise<UpdateEmailResponse | void>;
  settings?: GetSettingsResponse;
  updateSettings: (
    field: keyof UpdateSettingsRequest,
    value: UpdateSettingsRequest[keyof UpdateSettingsRequest],
  ) => Promise<UpdateSettingsResponse | void>;
  labels?: GetLabelsResponse["labels"];
  loadingLabels?: boolean;
  createLabel: (label: { name: string; color?: string }) => Promise<boolean>;
  updateLabel: (
    labelId: string,
    updates: { name?: string; color?: string },
  ) => Promise<boolean>;
  deleteLabel: (labelId: string) => Promise<void>;
};
export const SettingsContext = createContext<SettingsContextType>({
  username: "",
  newsletterEmail: null,
  changeUsername: (_username: string) => Promise.resolve(),
  updateNewsletterEmail: () => Promise.resolve(),
  updateSettings: async () => {},
  createLabel: async () => true,
  updateLabel: async () => true,
  deleteLabel: async () => {},
});
export const useSettings = (): SettingsContextType =>
  useContext(SettingsContext);
