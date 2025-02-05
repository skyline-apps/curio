"use client";
import React, { useContext } from "react";

import AppPage from "@/app/(protected)/AppPage";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import { Progress } from "@/components/ui/Progress";
import { ItemsContext } from "@/providers/ItemsProvider";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { isLoading } = useContext(ItemsContext);

  return (
    <div className="flex flex-row h-screen w-full">
      {isLoading && (
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
        <AppPage>{children}</AppPage>
      </div>
      <RightSidebar />
      <KeyboardShortcuts />
    </div>
  );
};

export default MainLayout;
