"use client";

import Profile from "@/components/Profile";

const UserPage = ({
  params,
}: {
  params: { username: string };
}): React.ReactElement => {
  return (
    <div className="flex-1 w-full h-full overflow-y-auto">
      <Profile username={params.username} />
    </div>
  );
};

export default UserPage;
