import {
  type AppLayoutSettings,
  DEFAULT_LAYOUT,
} from "@app/utils/displayStorage";
import { createContext, useContext } from "react";

export enum SidebarKey {
  NONE = "",
  HOME = "/home",
  INBOX = "/inbox",
  NOTES = "/notes",
  ARCHIVE = "/archive",
  PROFILE = "/u",
  SETTINGS = "/settings",
}

export type AppLayoutContextType = {
  appLayout: AppLayoutSettings;
  updateAppLayout: (settings: Partial<AppLayoutSettings>) => void;
  updateRootPage: (page: SidebarKey) => void;
  navigateToRoot: () => void;
};

export const AppLayoutContext = createContext<AppLayoutContextType>({
  appLayout: DEFAULT_LAYOUT,
  updateAppLayout: () => {},
  updateRootPage: () => {},
  navigateToRoot: () => {},
});

export const useAppLayout = (): AppLayoutContextType =>
  useContext(AppLayoutContext);
