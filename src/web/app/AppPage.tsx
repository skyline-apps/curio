"use client";
import { Dialog } from "@web/components/ui/Modal/Dialog";
import Spinner from "@web/components/ui/Spinner";
import { AppPageProvider } from "@web/providers/AppPageProvider";
import { UserContext } from "@web/providers/UserProvider";
import React, { useContext } from "react";

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
