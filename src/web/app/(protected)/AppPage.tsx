"use client";
import React, { useContext } from "react";

import Spinner from "@/components/Spinner";
import { UserContext } from "@/providers/UserProvider";

interface AppPageProps {
  children: React.ReactNode;
}

const AppPage: React.FC<AppPageProps> = ({ children }) => {
  const { user } = useContext(UserContext);

  return (
    <div className="w-full h-screen p-4 overflow-auto">
      {user.id ? children : <Spinner centered />}
    </div>
  );
};

export default AppPage;
