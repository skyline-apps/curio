import Profile from "@app/components/Profile";
import Spinner from "@app/components/ui/Spinner";
import { useUser } from "@app/providers/User";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const UserPage = (): React.ReactElement => {
  const { user } = useUser();
  const navigate = useNavigate();
  const { username } = useParams();

  useEffect(() => {
    if (!username) {
      if (user.username) {
        navigate(`/u/${user.username}`);
      } else {
        navigate("/");
      }
    }

    document.title = `Curio - ${username}`;
  }, [username, user.username, navigate]);

  return username ? <Profile username={username!} /> : <Spinner centered />;
};

export default UserPage;
