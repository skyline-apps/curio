import { Dialog } from "@app/components/ui/Modal/Dialog";
import Spinner from "@app/components/ui/Spinner";
import { AppPageProvider } from "@app/providers/AppPage/provider";
import { useUser } from "@app/providers/User";
import React from "react";

interface AppPageProps {
  children: React.ReactNode;
  enforceAuth: boolean;
}

const AppPage: React.FC<AppPageProps> = ({
  children,
  enforceAuth,
}: AppPageProps): React.ReactElement => {
  const { user } = useUser();

  return (
    <AppPageProvider>
      {enforceAuth ? user.id ? children : <Spinner centered /> : children}
      <Dialog />
    </AppPageProvider>
  );
};

export default AppPage;
