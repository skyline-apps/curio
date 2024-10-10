import React from "react";

import AppPage from "@/app/(protected)/AppPage";
import LeftSidebar from "@/components/LeftSidebar";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-row h-full w-full">
      <LeftSidebar />
      <div className="flex-1">
        <AppPage>{children}</AppPage>
      </div>
    </div>
  );
};

export default MainLayout;
