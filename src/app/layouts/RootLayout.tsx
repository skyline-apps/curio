import "@app/globals.css";
import "@fontsource/noto-sans";
import "@fontsource/noto-serif";
import "@fontsource/noto-sans-mono";

import UpgradeBanner from "@app/components/UpgradeBanner";
import { Walkthrough } from "@app/components/Walkthrough";
import Providers from "@app/providers";
import { cn } from "@app/utils/cn";
import { isNativePlatform } from "@app/utils/platform";
import React from "react";

type RootLayoutProps = React.PropsWithChildren;

const RootLayout: React.FC<RootLayoutProps> = ({
  children,
}: RootLayoutProps) => {
  return (
    <Providers>
      <UpgradeBanner />
      <main
        className={cn(
          "w-full h-dvh flex flex-col font-sans select-none",
          isNativePlatform() &&
            "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]",
        )}
      >
        {children}
      </main>
      <Walkthrough />
    </Providers>
  );
};

export default RootLayout;
