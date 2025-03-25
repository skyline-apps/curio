"use client";
import AppPage from "@web/app/AppPage";
import LeftSidebar from "@web/components/LeftSidebar";
import Navbar from "@web/components/Navbar";
import RightSidebar from "@web/components/RightSidebar";
import { UserContext } from "@web/providers/UserProvider";
import React, { useContext } from "react";

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const { user } = useContext(UserContext);
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
