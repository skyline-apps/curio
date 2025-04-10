import Profile from "@app/components/Profile";
import { useEffect } from "react";
import { useParams } from "react-router-dom";

const UserPage = (): React.ReactElement => {
  const { username } = useParams();
  useEffect(() => {
    document.title = `Curio - ${username}`;
  }, [username]);

  return <Profile username={username!} />;
};

export default UserPage;
