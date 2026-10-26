import { createLogger } from "@app/utils/logger";

const log = createLogger("displayStorage");

export interface AppLayoutSettings {
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
}

export enum SwipeAction {
  ARCHIVE = "archive",
  DELETE = "delete",
  MARK_READ = "mark_read",
  FAVORITE = "favorite",
  READ_OFFLINE = "read_offline",
  NONE = "none",
}

export interface SwipeSettings {
  swipeLeftAction: SwipeAction;
  swipeRightAction: SwipeAction;
}

export const DEFAULT_SWIPE_SETTINGS: SwipeSettings = {
  swipeLeftAction: SwipeAction.DELETE,
  swipeRightAction: SwipeAction.ARCHIVE,
};

export const DEFAULT_LAYOUT: AppLayoutSettings = {
  leftSidebarOpen: true,
  rightSidebarOpen: false,
};

export const SETTINGS_STORAGE_KEY = "curio_settings";

export function updateSwipeSettings(settings: Partial<SwipeSettings>): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const existing = localStorage.getItem(SETTINGS_STORAGE_KEY);
    const parsed = existing ? JSON.parse(existing) : {};
    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ ...parsed, ...settings }),
    );
  } catch (error) {
    log.error("Failed to update swipe settings:", error);
  }
}

export function loadSwipeSettings(): SwipeSettings {
  if (typeof window !== "undefined") {
    try {
      const settings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (settings) {
        const parsed = JSON.parse(settings);
        return {
          swipeLeftAction:
            parsed.swipeLeftAction !== undefined &&
            Object.values(SwipeAction).includes(parsed.swipeLeftAction)
              ? parsed.swipeLeftAction
              : DEFAULT_SWIPE_SETTINGS.swipeLeftAction,
          swipeRightAction:
            parsed.swipeRightAction !== undefined &&
            Object.values(SwipeAction).includes(parsed.swipeRightAction)
              ? parsed.swipeRightAction
              : DEFAULT_SWIPE_SETTINGS.swipeRightAction,
        };
      }
    } catch (error) {
      log.error("Failed to load swipe settings:", error);
    }
  }
  return DEFAULT_SWIPE_SETTINGS;
}

export function updateLayoutSettings(settings: AppLayoutSettings): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const existingSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    const parsed = existingSettings ? JSON.parse(existingSettings) : {};
    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ ...parsed, ...settings }),
    );
  } catch (error) {
    log.error("Failed to update layout settings:", error);
  }
}

export function loadLayoutSettings(): AppLayoutSettings {
  if (typeof window !== "undefined") {
    try {
      const settings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!settings) {
        return DEFAULT_LAYOUT;
      }
      return { ...DEFAULT_LAYOUT, ...JSON.parse(settings) };
    } catch (error) {
      log.error("Failed to load layout settings:", error);
    }
  }
  return DEFAULT_LAYOUT;
}

export function initializeTheme(): void {
  if (typeof window !== "undefined") {
    const storedTheme = localStorage.getItem("curio_theme");
    if (
      storedTheme === "dark" ||
      (!storedTheme &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }
}

export function setLightTheme(): void {
  localStorage.setItem("curio_theme", "light");
  document.documentElement.classList.remove("dark");
}

export function setDarkTheme(): void {
  localStorage.setItem("curio_theme", "dark");
  document.documentElement.classList.add("dark");
}

export function setSystemTheme(): void {
  localStorage.removeItem("curio_theme");
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export function clearTheme(): void {
  localStorage.removeItem("curio_theme");
}

export function storeRootPage(page: string): void {
  localStorage.setItem("curio_rootPage", page);
}

export function getStoredRootPage(): string | null {
  return localStorage.getItem("curio_rootPage");
}
