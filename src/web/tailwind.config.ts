// eslint-disable-next-line no-restricted-imports
import { heroui } from "@heroui/react";
import type { Config } from "tailwindcss";

import {
  brown,
  darkBrown,
  gray,
  lightBrown,
  themeColors,
} from "./utils/colors";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    fontFamily: {
      sans: ["var(--font-sans)", "sans-serif"],
      serif: ["var(--font-serif)", "sans-serif"],
      mono: ["var(--font-mono)", "monospace"],
    },
    extend: {
      animation: {
        "slide-in": "slide-in 0.3s forwards",
        "slide-out": "slide-out 0.3s forwards",
      },
      keyframes: {
        "slide-in": {
          "0%": {
            transform: "translateY(20px)",
            opacity: "0",
          },
          "100%": {
            transform: "translateY(0)",
            opacity: "1",
          },
        },
        "slide-out": {
          "0%": {
            transform: "translateY(0)",
            opacity: "1",
          },
          "100%": {
            transform: "translateY(20px)",
            opacity: "0",
          },
        },
      },
    },
  },
  darkMode: "class",
  plugins: [
    require("@tailwindcss/typography"),
    heroui({
      layout: {
        boxShadow: {
          small: "0 0 0 1px rgba(0, 0, 0, 0.05)",
          medium: "0 0px 2px 1px rgba(0, 0, 0, 0.05)",
          large:
            "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        },
        radius: {
          small: "0.25rem",
          medium: "0.25rem",
          large: "0.25rem",
        },
      },
      themes: {
        light: {
          colors: {
            background: {
              300: brown[15],
              400: brown[25],
              DEFAULT: brown[50],
              600: brown[75],
              700: brown[100],
            },
            focus: brown[200],
            foreground: darkBrown,
            default: { ...brown, foreground: darkBrown, DEFAULT: brown[200] },
            secondary: { ...gray, foreground: darkBrown, DEFAULT: gray[700] },
            divider: brown[100],
            content1: brown[25],
            content2: brown[200],
            content3: brown[200],
            content4: brown[300],
            ...themeColors,
          },
        },
        dark: {
          colors: {
            background: {
              300: brown[985],
              400: brown[975],
              DEFAULT: brown[950],
              600: brown[925],
              700: brown[900],
            },
            focus: brown[800],
            foreground: lightBrown,
            default: { ...brown, foreground: lightBrown, DEFAULT: brown[800] },
            secondary: { ...gray, foreground: lightBrown, DEFAULT: gray[300] },
            divider: brown[975],
            content1: brown[925],
            content2: brown[800],
            content3: brown[800],
            content4: brown[700],
            ...themeColors,
          },
        },
      },
    }),
  ],
};
export default config;
