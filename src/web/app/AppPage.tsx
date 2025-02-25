"use client";
import React, { useContext } from "react";

import { Dialog } from "@/components/ui/Modal/Dialog";
import Spinner from "@/components/ui/Spinner";
import { AppPageProvider } from "@/providers/AppPageProvider";
import { UserContext } from "@/providers/UserProvider";

interface AppPageProps {
  children: React.ReactNode;
  enforceAuth: boolean;
}

const AppPage: React.FC<AppPageProps> = ({
  children,
  enforceAuth,
}: AppPageProps): React.ReactElement => {
  const { user } = useContext(UserContext);

  return (
    <AppPageProvider>
      {enforceAuth ? user.id ? children : <Spinner centered /> : children}
      <Dialog />
    </AppPageProvider>
  );
};

export default AppPage;
