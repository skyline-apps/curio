import Footer from "@app/components/Landing/Footer";
import Navbar from "@app/components/Navbar";
import Button from "@app/components/ui/Button";
import Spinner from "@app/components/ui/Spinner";
import { useUser } from "@app/providers/User";
import { useNavigate, useSearchParams } from "react-router-dom";

const RedirectPage: React.FC = () => {
  const { user } = useUser();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  if (user && user.id) {
    // Already signed in; redirect to home
    navigate("/home");
    return <Spinner centered />;
  }
  const redirectTo = searchParams.get("redirectTo");
  const email = searchParams.get("email");

  if (!email || !redirectTo) {
    return (
      <div className="w-full flex flex-col items-center gap-4 py-16">
        <p className="text-danger">Invalid link.</p>
        <Button href="/">Go home</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-dvh">
      <Navbar />
      <div className="flex-1">
        <div className="flex flex-col gap-4 my-16">
          <div className="w-full flex flex-col items-center gap-4 py-16">
            <h1>Log in</h1>
            <p className="text-xs text-secondary">Sign in as {email}?</p>
            <Button color="primary" href={redirectTo}>
              Continue
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default RedirectPage;
