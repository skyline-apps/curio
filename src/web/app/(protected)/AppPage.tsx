"use client";
import React, { useContext } from "react";

import { Dialog } from "@/components/ui/Modal/Dialog";
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
      <Dialog />
    </AppPageProvider>
  );
};

export default AppPage;
