import type {
  SettingsResponse,
  UpdatedSettingsResponse,
} from "@app/api/v1/user/settings/validation";
import type { GetLabelsResponse } from "@web/app/api/v1/user/labels/validation";
import { createContext, useContext } from "react";

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
export const SettingsContext = createContext<SettingsContextType>({
  updateSettings: async () => {},
  createLabel: async () => true,
  updateLabel: async () => true,
  deleteLabel: async () => {},
});
export const useSettings = (): SettingsContextType =>
  useContext(SettingsContext);
