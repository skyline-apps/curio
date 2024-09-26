import { nextui } from "@nextui-org/react";

import { brown, darkBrown, themeColors } from "./utils/colors";

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [
    nextui({
      layout: {
        radius: {
          small: "0.0625rem",
          medium: "0.125rem",
          large: "0.25rem",
        },
      },
      themes: {
        light: {
          colors: {
            background: brown[25],
            foreground: darkBrown,
            ...themeColors,
          },
        },
        dark: {
          colors: {
            background: darkBrown,
            foreground: brown[25],
            ...themeColors,
          },
        },
      },
    }),
  ],
};
export default config;
