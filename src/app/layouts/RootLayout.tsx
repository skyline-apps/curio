import "@app/globals.css";

import Providers from "@app/providers";
import { monoFonts, sansFonts, serifFonts } from "@app/styles/fonts";
import React from "react";

type RootLayoutProps = React.PropsWithChildren;

const RootLayout: React.FC<RootLayoutProps> = ({
  children,
}: RootLayoutProps) => {
  React.useEffect(() => {
    // Load default fonts immediately
    sansFonts[0].load();
    serifFonts[0].load();
    monoFonts[0].load();

    // Load other fonts when needed (e.g., based on language or user preference)
  }, []);

  const fontClasses = [
    ...sansFonts.map((font) => font.variable),
    ...serifFonts.map((font) => font.variable),
    ...monoFonts.map((font) => font.variable),
  ];
  return (
    <html lang="en" className={fontClasses.join(" ")} suppressHydrationWarning>
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
        <meta property="og:site_name" content="Curio" />
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
          <main className="w-full h-full min-h-dvh flex flex-col">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
};

export default RootLayout;
