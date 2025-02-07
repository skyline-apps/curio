"use client";
import React, { useContext } from "react";

import Spinner from "@/components/ui/Spinner";
import { AppPageProvider } from "@/providers/AppPageProvider";
import { UserContext } from "@/providers/UserProvider";

interface AppPageProps {
  children: React.ReactNode;
}

const AppPage: React.FC<AppPageProps> = ({ children }) => {
  const { user } = useContext(UserContext);

  return (
    <AppPageProvider>
      {user.id ? children : <Spinner centered />}
    </AppPageProvider>
  );
};

export default AppPage;
