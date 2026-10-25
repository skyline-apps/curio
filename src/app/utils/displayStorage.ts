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

export const SWIPE_SETTINGS_STORAGE_KEY = "curio_swipe_settings";

export function updateSwipeSettings(settings: Partial<SwipeSettings>): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const current = loadSwipeSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SWIPE_SETTINGS_STORAGE_KEY, JSON.stringify(updated));

    // Also update legacy curio_settings for backwards compatibility
    const existingLegacy = localStorage.getItem("curio_settings");
    if (existingLegacy) {
      try {
        const parsedLegacy = JSON.parse(existingLegacy);
        localStorage.setItem(
          "curio_settings",
          JSON.stringify({ ...parsedLegacy, ...settings }),
        );
      } catch {
        localStorage.setItem("curio_settings", JSON.stringify(settings));
      }
    } else {
      localStorage.setItem("curio_settings", JSON.stringify(settings));
    }
  } catch (error) {
    log.error("Failed to update swipe settings:", error);
  }
}

export function loadSwipeSettings(): SwipeSettings {
  if (typeof window !== "undefined") {
    try {
      // Check dedicated storage key first
      const stored = localStorage.getItem(SWIPE_SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
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

      // Check legacy curio_settings
      const legacySettings = localStorage.getItem("curio_settings");
      if (legacySettings) {
        const parsed = JSON.parse(legacySettings);
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
    const existingSettings = localStorage.getItem("curio_settings");
    if (existingSettings) {
      localStorage.setItem(
        "curio_settings",
        JSON.stringify({ ...JSON.parse(existingSettings), ...settings }),
      );
    } else {
      localStorage.setItem("curio_settings", JSON.stringify(settings));
    }
  } catch (error) {
    log.error("Failed to update layout settings:", error);
  }
}

export function loadLayoutSettings(): AppLayoutSettings {
  if (typeof window !== "undefined") {
    try {
      const settings = localStorage.getItem("curio_settings");
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
