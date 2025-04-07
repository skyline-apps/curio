import YarnDark from "@app/assets/yarn_dark.svg";
import YarnLight from "@app/assets/yarn_light.svg";
import EmailSignIn from "@app/components/Auth/EmailSignIn";
import GoogleSignIn from "@app/components/Auth/GoogleSignIn";
import Footer from "@app/components/Landing/Footer";
import Navbar from "@app/components/Navbar";
import Spinner from "@app/components/ui/Spinner";
import { useUser } from "@app/providers/User";
import React from "react";
import { Link, useNavigate } from "react-router-dom";

type LoginPageProps = Record<never, never>;

const LoginPage: React.FC<LoginPageProps> = ({}: LoginPageProps) => {
  const { user } = useUser();
  const navigate = useNavigate();
  if (user && user.id) {
    // Already signed in; redirect to home
    navigate("/home");
    return <Spinner centered />;
  }

  return (
    <div className="flex flex-col w-full h-dvh overflow-hidden">
      <Navbar />
      <div className="flex-1">
        <div className="flex flex-col gap-4 my-16">
          <div className="flex flex-col items-center gap-2 w-64 mx-auto">
            <div className="mb-8">
              <YarnLight className="w-24 h-24 mb-4 block dark:hidden" />
              <YarnDark className="w-24 h-24 mb-4 block hidden dark:block" />
            </div>
            <GoogleSignIn nextUrl="/home" />
            <p className="text-secondary text-xs">or</p>
            <EmailSignIn />
            <p className="text-secondary text-xs text-center mt-2">
              By signing up, you agree to our{" "}
              <Link className="hover:underline" to="/terms" target="_blank">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link className="hover:underline" to="/privacy" target="_blank">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LoginPage;
