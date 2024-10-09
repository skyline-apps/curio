import "./globals.css";

import type { Metadata } from "next";
import { Noto_Sans, Noto_Sans_Mono, Noto_Serif } from "next/font/google";
import React from "react";

import Navbar from "@/components/Navbar";
import Providers from "@/providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://curi.ooo"),
  title: "Curio",
  description: "Curate your inspirations",
};

interface RootLayoutProps extends React.PropsWithChildren {
  modal: React.ReactNode;
}

const sans = Noto_Sans({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-sans",
});

const serif = Noto_Serif({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-serif",
});

const mono = Noto_Sans_Mono({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-mono",
});

const RootLayout: React.FC<RootLayoutProps> = ({
  children,
  modal,
}: RootLayoutProps) => {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${serif.variable} ${mono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
        (function() {
          function getInitialColorMode() {
            const persistedColorPreference = window.localStorage.getItem('theme');
            const hasPersistedPreference = typeof persistedColorPreference === 'string';
            if (hasPersistedPreference) {
              return persistedColorPreference;
            }
            const mql = window.matchMedia('(prefers-color-scheme: dark)');
            const hasMediaQueryPreference = typeof mql.matches === 'boolean';
            if (hasMediaQueryPreference) {
              return mql.matches ? 'dark' : 'light';
            }
            return 'light';
          }
          const colorMode = getInitialColorMode();
          document.documentElement.classList.add(colorMode);
        })();
      `,
          }}
        />
      </head>
      <body className="text-foreground">
        <Providers>
          <Navbar />
          <main className="w-full p-4">{children}</main>
          {modal}
        </Providers>
      </body>
    </html>
  );
};

export default RootLayout;
