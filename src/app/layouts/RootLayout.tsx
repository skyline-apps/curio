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
    <Providers>
      <main className="w-full h-full min-h-dvh flex flex-col">
        {children}
      </main>
    </Providers>
  );
};

export default RootLayout;
