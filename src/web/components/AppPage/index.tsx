import React, { useContext } from "react";

import LeftSidebar from "@/components/LeftSidebar";
import Spinner from "@/components/Spinner";
import { UserContext } from "@/providers/UserProvider";

interface AppPageProps extends React.PropsWithChildren {}

const AppPage: React.FC<AppPageProps> = ({ children }: AppPageProps) => {
  const { user } = useContext(UserContext);
  return (
    <div className="flex flex-row h-full w-full">
      <LeftSidebar />
      <div className="w-full h-screen p-4 overflow-auto">
        {user.id ? children : <Spinner centered />}
      </div>
    </div>
  );
};

export default AppPage;
