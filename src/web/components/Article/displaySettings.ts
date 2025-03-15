import { DisplayFont, DisplayFontSize, DisplayLineHeight } from "@/db/schema";

export const displayFontClass = {
  [DisplayFont.MONO]: "font-mono",
  [DisplayFont.SANS]: "font-sans",
  [DisplayFont.SERIF]: "font-serif",
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

export const displayLineHeightClass = {
  [DisplayLineHeight.SM]: "leading-6",
  [DisplayLineHeight.MD]: "leading-8",
  [DisplayLineHeight.LG]: "leading-10",
};
