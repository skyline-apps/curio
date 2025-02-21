"use client";
import React, { useContext } from "react";

import Profile from "@/components/Profile";
import { UserContext } from "@/providers/UserProvider";

const ProfilePage: React.FC = (): React.ReactElement => {
  const { user } = useContext(UserContext);
  if (!user.id || !user.username) {
    return <p className="text-danger">User not found.</p>;
  }
  return <Profile username={user.username} />;
};

export default ProfilePage;
