import { createLogger } from "@app/utils/logger";

interface FontLoader {
  variable: string;
  load: () => Promise<boolean>;
}

const log = createLogger("fonts");

const loadFont = async (fontName: string): Promise<boolean> => {
  try {
    await import(`@fontsource/${fontName}`);
    const font = new FontFace(fontName, `local('${fontName}')`);
    await font.load();
    document.fonts.add(font);
    return true;
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
const sans = createFontLoader("noto-serif", "--font-sans-default");
const serif = createFontLoader("noto-serif", "--font-serif-default");
const mono = createFontLoader("noto-sans-mono", "--font-mono-default");

const sansOther = createFontLoader("noto-sans", "--font-sans-other");
const serifOther = createFontLoader("noto-serif", "--font-serif-other");
const monoOther = createFontLoader("noto-sans-mono", "--font-mono-other");

const sansArabic = createFontLoader("noto-sans-arabic", "--font-sans-arabic");
const serifArabic = createFontLoader(
  "noto-naskh-arabic",
  "--font-serif-arabic",
);
const monoArabic = createFontLoader("noto-kufi-arabic", "--font-mono-arabic");

export const sansFonts = [sans, sansOther, sansArabic];
export const serifFonts = [serif, serifOther, serifArabic];
export const monoFonts = [mono, monoOther, monoArabic];
