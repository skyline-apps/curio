"use client";
import { useContext } from "react";

import LeftSidebar from "@/components/LeftSidebar";
import Navbar from "@/components/Navbar";
import Profile from "@/components/Profile";
import { UserContext } from "@/providers/UserProvider";

const UserPage = ({
  params,
}: {
  params: { username: string };
}): React.ReactElement => {
  const { user } = useContext(UserContext);
  const isAuthenticated = user && user.id;

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden">
      {!isAuthenticated && <Navbar />}
      <div className="flex flex-row h-full">
        {isAuthenticated && <LeftSidebar />}
        <div className="flex-1 overflow-y-auto">
          <Profile username={params.username} />
        </div>
      </div>
    </div>
  );
};

export default UserPage;
