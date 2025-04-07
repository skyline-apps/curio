import { monoFonts, sansFonts, serifFonts } from "@app/styles/fonts"; // Adjust the import path if needed
import { DisplayFont, DisplayFontSize } from "@shared/db";
import { lookup } from "bcp-47-match";

export const getDisplayFontClass = (
  font: DisplayFont,
  language: string,
): string => {
  const arabic = !!lookup([language], "ar");
  switch (font) {
    case DisplayFont.MONO:
      if (arabic) {
        monoFonts.find((f) => f.variable === "--font-mono-arabic")?.load();
      }
      return arabic ? "font-mono-arabic" : "font-mono";
    case DisplayFont.SANS:
      if (arabic) {
        sansFonts.find((f) => f.variable === "--font-sans-arabic")?.load();
      }
      return arabic ? "font-sans-arabic" : "font-sans";
    case DisplayFont.SERIF:
      if (arabic) {
        serifFonts.find((f) => f.variable === "--font-serif-arabic")?.load();
      }
      return arabic ? "font-serif-arabic" : "font-serif";
    default:
      return "font-sans";
  }
};

export const displayFontSizeClass = {
  [DisplayFontSize.SM]: "prose-sm",
  [DisplayFontSize.MD]: "prose-base",
  [DisplayFontSize.LG]: "prose-lg",
  [DisplayFontSize.XL]: "prose-xl",
};

export const displayHeaderSizeClass = {
  [DisplayFontSize.SM]: "text-lg",
  [DisplayFontSize.MD]: "text-xl",
  [DisplayFontSize.LG]: "text-2xl",
  [DisplayFontSize.XL]: "text-3xl",
};
