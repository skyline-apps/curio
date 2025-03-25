import { lookup } from "bcp-47-match";

import { DisplayFont, DisplayFontSize } from "@web/db/schema";

export const getDisplayFontClass = (
  font: DisplayFont,
  language: string,
): string => {
  const arabic = !!lookup([language], "ar");
  const other = !!lookup(
    [language],
    [
      "ru",
      "uk",
      "be",
      "bg",
      "sr",
      "mk",
      "me",
      "kk",
      "ky",
      "tg",
      "mn",
      "el",
      "vi",
    ],
  );
  switch (font) {
    case DisplayFont.MONO:
      return arabic
        ? "font-mono-arabic"
        : other
          ? "font-mono-other"
          : "font-mono";
    case DisplayFont.SANS:
      return arabic
        ? "font-sans-arabic"
        : other
          ? "font-sans-other"
          : "font-sans";
    case DisplayFont.SERIF:
      return arabic
        ? "font-serif-arabic"
        : other
          ? "font-serif-other"
          : "font-serif";
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
