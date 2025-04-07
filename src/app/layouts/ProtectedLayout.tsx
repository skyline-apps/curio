import AppPage from "@app/components/AppPage";
import KeyboardShortcuts from "@app/components/KeyboardShortcuts";
import LeftSidebar from "@app/components/LeftSidebar";
import RightSidebar from "@app/components/RightSidebar";
import { Progress } from "@app/components/ui/Progress";
import Spinner from "@app/components/ui/Spinner";
import { HighlightsContext } from "@app/providers/Highlights";
import { ItemsContext } from "@app/providers/Items";
import { useSettings } from "@app/providers/Settings";
import React, { useContext } from "react";
import { useLocation } from "react-router-dom";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { isFetching: isFetchingItems } = useContext(ItemsContext);
  const { isFetching: isFetchingHighlights } = useContext(HighlightsContext);
  const { settings } = useSettings();
  const { pathname } = useLocation();

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
