import React from "react";

import AppPage from "@/app/(protected)/AppPage";
import LeftSidebar from "@/components/LeftSidebar";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-row h-screen w-full">
      <LeftSidebar />
      <div className="flex-1 overflow-y-auto">
        <AppPage>
          <div className="p-4">{children}</div>
        </AppPage>
      </div>
    </div>
  );
};

export default MainLayout;
