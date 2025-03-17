import {
  Noto_Kufi_Arabic,
  Noto_Naskh_Arabic,
  Noto_Sans,
  Noto_Sans_Arabic,
  Noto_Sans_Mono,
  Noto_Serif,
} from "next/font/google";

const sans = Noto_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans-default",
  preload: true,
});
const serif = Noto_Serif({
  subsets: ["latin", "latin-ext"],
  variable: "--font-serif-default",
  preload: true,
});
const mono = Noto_Sans_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-mono-default",
  preload: true,
});

const sansOther = Noto_Sans({
  subsets: ["cyrillic", "cyrillic-ext", "greek", "greek-ext", "vietnamese"],
  variable: "--font-sans-other",
  preload: false,
  adjustFontFallback: false,
});
const serifOther = Noto_Serif({
  subsets: ["cyrillic", "cyrillic-ext", "greek", "greek-ext", "vietnamese"],
  variable: "--font-serif-other",
  preload: false,
  adjustFontFallback: false,
});
const monoOther = Noto_Sans_Mono({
  subsets: ["cyrillic", "cyrillic-ext", "greek", "greek-ext", "vietnamese"],
  variable: "--font-mono-other",
  preload: false,
  adjustFontFallback: false,
});

const sansArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-sans-arabic",
  preload: false,
  adjustFontFallback: false,
});
const serifArabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  variable: "--font-serif-arabic",
  preload: false,
  adjustFontFallback: false,
});
const monoArabic = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  variable: "--font-mono-arabic",
  preload: false,
  adjustFontFallback: false,
});

export const sansFonts = [sans, sansOther, sansArabic];
export const serifFonts = [serif, serifOther, serifArabic];
export const monoFonts = [mono, monoOther, monoArabic];
