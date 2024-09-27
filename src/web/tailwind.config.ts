import { nextui } from "@nextui-org/react";
import type { Config } from "tailwindcss";

import { brown, darkBrown, lightBrown, themeColors } from "./utils/colors";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    fontFamily: {
      sans: ["var(--font-sans)", "sans-serif"],
      serif: ["var(--font-serif)", "sans-serif"],
      mono: ["var(--font-mono)", "monospace"],
    },
    extend: {},
  },
  darkMode: "class",
  plugins: [
    nextui({
      layout: {
        boxShadow: {
          small: "0 0 0 1px rgba(0, 0, 0, 0.05)",
          medium: "0 0px 2px 1px rgba(0, 0, 0, 0.05)",
          large:
            "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        },
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
            content1: lightBrown,
            ...themeColors,
          },
        },
        dark: {
          colors: {
            background: darkBrown,
            foreground: brown[25],
            content1: brown[800],
            ...themeColors,
          },
        },
      },
    }),
  ],
};
export default config;
