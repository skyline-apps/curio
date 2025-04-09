import type { GetLabelsResponse } from "@app/schemas/v1/user/labels";
import type {
  GetSettingsResponse,
  UpdateSettingsRequest,
  UpdateSettingsResponse,
} from "@app/schemas/v1/user/settings";
import { createContext, useContext } from "react";

export type SettingsContextType = {
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
  updateSettings: async () => {},
  createLabel: async () => true,
  updateLabel: async () => true,
  deleteLabel: async () => {},
});
export const useSettings = (): SettingsContextType =>
  useContext(SettingsContext);
