"use client";
import { usePathname } from "next/navigation";
import React, { useContext } from "react";

import AppPage from "@web/app/AppPage";
import KeyboardShortcuts from "@web/components/KeyboardShortcuts";
import LeftSidebar from "@web/components/LeftSidebar";
import RightSidebar from "@web/components/RightSidebar";
import { Progress } from "@web/components/ui/Progress";
import Spinner from "@web/components/ui/Spinner";
import { HighlightsContext } from "@web/providers/HighlightsProvider";
import { ItemsContext } from "@web/providers/ItemsProvider";
import { useSettings } from "@web/providers/SettingsProvider";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { isFetching: isFetchingItems } = useContext(ItemsContext);
  const { isFetching: isFetchingHighlights } = useContext(HighlightsContext);
  const { settings } = useSettings();
  const pathname = usePathname();

  return settings ? (
    <div className="flex flex-row h-dvh w-full">
      {(isFetchingItems || isFetchingHighlights) && (
        <Progress
          aria-label="Loading..."
          size="sm"
          isIndeterminate
          classNames={{
            base: "mb-4 fixed top-0 left-0",
            track: "rounded-none",
            indicator: "bg-gradient-to-r from-success to-primary",
          }}
        />
      )}
      <LeftSidebar />
      <div className="flex-1 overflow-y-auto">
        <AppPage enforceAuth={true}>{children}</AppPage>
      </div>
      {pathname !== "/settings" && <RightSidebar />}
      <KeyboardShortcuts />
    </div>
  ) : (
    <div className="h-dvh">
      <Spinner centered />
    </div>
  );
};

export default MainLayout;
