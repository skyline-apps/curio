"use client";

import Profile from "@web/components/Profile";
import { useEffect } from "react";

const UserPage = ({
  params,
}: {
  params: { username: string };
}): React.ReactElement => {
  useEffect(() => {
    document.title = `Curio - ${params.username}`;
  }, [params.username]);

  return (
    <div className="flex-1 w-full h-full overflow-y-auto">
      <Profile username={params.username} />
    </div>
  );
};

export default UserPage;
