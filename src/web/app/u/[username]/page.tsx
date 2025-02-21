"use client";
import { useContext } from "react";

import AppPage from "@/app/(protected)/AppPage";
import LeftSidebar from "@/components/LeftSidebar";
import Profile from "@/components/Profile";
import RightSidebar from "@/components/RightSidebar";
import { UserContext } from "@/providers/UserProvider";

const UserPage = ({
  params,
}: {
  params: { username: string };
}): React.ReactElement => {
  const { user } = useContext(UserContext);
  return (
    <div className="flex flex-row h-screen w-full">
      {user && <LeftSidebar />}
      <div className="flex-1 overflow-y-auto">
        <AppPage>
          <Profile username={params.username} />
        </AppPage>
      </div>
      <RightSidebar />
    </div>
  );
};

export default UserPage;
