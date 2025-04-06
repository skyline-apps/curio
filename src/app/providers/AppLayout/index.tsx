import {
  type AppLayoutSettings,
  DEFAULT_LAYOUT,
} from "@app/utils/displayStorage";
import { createContext, useContext } from "react";

export type AppLayoutContextType = {
  appLayout: AppLayoutSettings;
  updateAppLayout: (settings: Partial<AppLayoutSettings>) => void;
};

export const AppLayoutContext = createContext<AppLayoutContextType>({
  appLayout: DEFAULT_LAYOUT,
  updateAppLayout: () => {},
});

export const useAppLayout = (): AppLayoutContextType =>
  useContext(AppLayoutContext);
