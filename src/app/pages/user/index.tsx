import Profile from "@app/components/Profile";
import Spinner from "@app/components/ui/Spinner";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const UserPage = (): React.ReactElement => {
  const navigate = useNavigate();
  const { username } = useParams();

  useEffect(() => {
    if (!username) {
      navigate("/");
    }

    document.title = `Curio - ${username}`;
  }, [username, navigate]);

  return username ? <Profile username={username!} /> : <Spinner centered />;
};

export default UserPage;
