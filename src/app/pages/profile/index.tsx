import Profile from "@app/components/Profile";
import { useEffect } from "react";
import { useParams } from "react-router-dom";

const UserPage = (): React.ReactElement => {
  const { username } = useParams();
  useEffect(() => {
    document.title = `Curio - ${username}`;
  }, [username]);

  return (
    <div className="flex-1 w-full h-full overflow-y-auto">
      <Profile username={username!} />
    </div>
  );
};

export default UserPage;
