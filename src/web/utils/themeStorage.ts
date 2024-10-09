export function initializeTheme(): void {
  if (typeof window !== "undefined") {
    const storedTheme = localStorage.getItem("theme");
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
  localStorage.setItem("theme", "light");
  document.documentElement.classList.remove("dark");
}

export function setDarkTheme(): void {
  localStorage.setItem("theme", "dark");
  document.documentElement.classList.add("dark");
}

export function setSystemTheme(): void {
  localStorage.removeItem("theme");
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export function clearTheme(): void {
  localStorage.removeItem("theme");
}
