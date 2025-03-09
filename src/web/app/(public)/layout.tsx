"use client";
import React, { useContext } from "react";

import AppPage from "@/app/AppPage";
import LeftSidebar from "@/components/LeftSidebar";
import Navbar from "@/components/Navbar";
import RightSidebar from "@/components/RightSidebar";
import { UserContext } from "@/providers/UserProvider";

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
