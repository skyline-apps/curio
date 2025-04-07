import { createLogger } from "@app/utils/logger";

interface FontLoader {
  variable: string;
  load: () => Promise<boolean>;
}

const log = createLogger("fonts");

// Mapping of font names to their import paths for on-demand loading
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fontImportMap: Record<string, () => Promise<any>> = {
  "noto-sans-arabic": () => import("@fontsource/noto-sans-arabic"),
  "noto-naskh-arabic": () => import("@fontsource/noto-naskh-arabic"),
  "noto-kufi-arabic": () => import("@fontsource/noto-kufi-arabic"),
};

const loadFont = async (fontName: string): Promise<boolean> => {
  try {
    const importFn = fontImportMap[fontName];
    if (!importFn) {
      log.error(`Font ${fontName} not found in fontImportMap.`);
      return false;
    }
    await importFn();
    return true; // Assume @fontsource handles loading
  } catch (error) {
    log.error(`Failed to load font ${fontName}:`, error);
    return false;
  }
};

const createFontLoader = (fontName: string, variable: string): FontLoader => {
  let loaded = false;

  return {
    variable,
    load: async () => {
      if (!loaded) {
        loaded = await loadFont(fontName);
      }
      return loaded;
    },
  };
};

// Create font loaders with their CSS variables
const sans = {
  variable: "font-sans",
  load: async (): Promise<boolean> => true,
}; // Default font, loaded directly
const serif = {
  variable: "font-serif",
  load: async (): Promise<boolean> => true,
}; // Default font, loaded directly
const mono = {
  variable: "font-mono",
  load: async (): Promise<boolean> => true,
}; // Default font, loaded directly

const sansArabic = createFontLoader("noto-sans-arabic", "font-sans-arabic");
const serifArabic = createFontLoader("noto-naskh-arabic", "font-serif-arabic");
const monoArabic = createFontLoader("noto-kufi-arabic", "font-mono-arabic");

export const sansFonts = [sans, sansArabic];
export const serifFonts = [serif, serifArabic];
export const monoFonts = [mono, monoArabic];
