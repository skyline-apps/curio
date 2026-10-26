import YarnDark from "@app/assets/yarn_dark.svg";
import YarnLight from "@app/assets/yarn_light.svg";
import EmailSignIn from "@app/components/Auth/EmailSignIn";
import GoogleSignIn from "@app/components/Auth/GoogleSignIn";
import PasswordSignIn from "@app/components/Auth/PasswordSignIn";
import Footer from "@app/components/Landing/Footer";
import Navbar from "@app/components/Navbar";
import Spinner from "@app/components/ui/Spinner";
import { useUser } from "@app/providers/User";
import React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

type LoginPageProps = Record<never, never>;

const LoginPage: React.FC<LoginPageProps> = ({}: LoginPageProps) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [demoEmail, setDemoEmail] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState<boolean>(false);
  if (user && user.id) {
    // Already signed in; redirect to home
    navigate("/home");
    return <Spinner centered />;
  }
  const error = searchParams.get("error");
  let errorMessage = error;
  if (error === "session_error") {
    errorMessage =
      "There was a problem signing in. Please try again and contact us if this persists.";
  } else if (error === "no_code") {
    errorMessage = "No authentication code found.";
  }

  return (
    <div className="flex flex-col w-full h-dvh">
      <Navbar />
      <div className="flex-1">
        <div className="flex flex-col gap-4 my-16">
          <div className="flex flex-col items-center gap-2 w-64 mx-auto">
            <div className="mb-4">
              <YarnLight className="w-24 h-24 mb-4 block dark:hidden" />
              <YarnDark className="w-24 h-24 mb-4 block hidden dark:block" />
            </div>
            <p className="text-center text-xs text-secondary-700 mb-4">
              New or existing user? Sign in to Curio using one of the methods
              below.
            </p>
            <GoogleSignIn nextUrl="/home" />
            <p className="text-secondary text-xs">or</p>
            {showPassword || demoEmail ? (
              <PasswordSignIn initialEmail={demoEmail || undefined} />
            ) : (
              <EmailSignIn
                onDemoLogin={(email) => {
                  setDemoEmail(email);
                  setShowPassword(true);
                }}
              />
            )}
            <button
              type="button"
              onClick={() => {
                setShowPassword(!showPassword);
                if (showPassword) setDemoEmail(null);
              }}
              className="text-xs text-secondary hover:underline cursor-pointer mt-1"
            >
              {showPassword || demoEmail
                ? "Sign in with email link"
                : "Sign in with password"}
            </button>
            {errorMessage && (
              <p className="text-danger text-sm text-center mt-2">
                {errorMessage}
              </p>
            )}
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
