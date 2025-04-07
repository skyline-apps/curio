import AppPage from "@app/components/AppPage";
import LeftSidebar from "@app/components/LeftSidebar";
import Navbar from "@app/components/Navbar";
import RightSidebar from "@app/components/RightSidebar";
import { useUser } from "@app/providers/User";
import React from "react";

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const { user } = useUser();
  const isAuthenticated = user && user.id;

  return (
    <div className="flex flex-col w-full h-dvh overflow-hidden">
      {!isAuthenticated && <Navbar />}
      <div className="flex flex-row h-full">
        {isAuthenticated && <LeftSidebar />}
        <div className="flex-1 overflow-y-auto">
          <AppPage enforceAuth={false}>{children}</AppPage>
        </div>
        <RightSidebar />
      </div>
    </div>
  );
};

export default PublicLayout;
