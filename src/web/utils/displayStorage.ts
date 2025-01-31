export interface AppLayoutSettings {
  leftSidebarOpen: boolean;
}

const DEFAULT_LAYOUT: AppLayoutSettings = {
  leftSidebarOpen: true,
};

export function updateLayoutSettings(settings: AppLayoutSettings): void {
  const existingSettings = localStorage.getItem("curio_settings");
  if (existingSettings) {
    localStorage.setItem(
      "curio_settings",
      JSON.stringify({ ...JSON.parse(existingSettings), ...settings }),
    );
  } else {
    localStorage.setItem("curio_settings", JSON.stringify(settings));
  }
}

export function loadLayoutSettings(): AppLayoutSettings {
  if (typeof window !== "undefined") {
    const settings = localStorage.getItem("curio_settings");
    if (!settings) {
      return DEFAULT_LAYOUT;
    }
    return JSON.parse(settings);
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
