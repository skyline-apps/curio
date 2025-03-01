import "./globals.css";

import type { Metadata } from "next";
import { Noto_Sans, Noto_Sans_Mono, Noto_Serif } from "next/font/google";
import React from "react";

import Providers from "@/providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://curi.ooo"),
  title: "Curio",
  description: "Feed your curiosity.",
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
      suppressHydrationWarning
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
        <meta property="og:title" content="Curio" />
        <meta property="og:description" content="Feed your curiosity." />
        <meta
          property="og:image"
          content="https://curi.ooo/assets/curio_banner.png"
        />
        <meta property="og:url" content="https://curi.ooo" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Curio" />
        <meta name="twitter:description" content="Feed your curiosity." />
        <meta
          name="twitter:image"
          content="https://curi.ooo/assets/curio_banner.png"
        />
      </head>
      <body className="text-foreground select-none">
        <Providers>
          <main className="w-full h-full">{children}</main>
          {modal}
        </Providers>
      </body>
    </html>
  );
};

export default RootLayout;
