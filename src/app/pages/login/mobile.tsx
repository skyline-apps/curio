import YarnDark from "@app/assets/yarn_dark.svg";
import YarnLight from "@app/assets/yarn_light.svg";
import AppleSignIn from "@app/components/Auth/AppleSignIn";
import EmailSignIn from "@app/components/Auth/EmailSignIn";
import GoogleSignIn from "@app/components/Auth/GoogleSignIn";
import PasswordSignIn from "@app/components/Auth/PasswordSignIn";
import { CurioBrand } from "@app/components/CurioBrand";
import Spinner from "@app/components/ui/Spinner";
import { useUser } from "@app/providers/User";
import React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

type MobileLoginPageProps = Record<never, never>;

const MobileLoginPage: React.FC<
  MobileLoginPageProps
> = ({}: MobileLoginPageProps) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [demoEmail, setDemoEmail] = React.useState<string | null>(null);

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
    <div className="flex flex-col w-full h-dvh justify-center">
      <div className="flex flex-col gap-4 my-16">
        <div className="flex flex-col items-center gap-2 w-64 mx-auto">
          <div className="mb-8">
            <CurioBrand />
          </div>
          <GoogleSignIn nextUrl="/home" />
          <AppleSignIn nextUrl="/home" />
          <p className="text-secondary text-xs">or</p>
          {demoEmail ? (
            <PasswordSignIn initialEmail={demoEmail} />
          ) : (
            <EmailSignIn onDemoLogin={(email) => setDemoEmail(email)} />
          )}
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
          <div className="mt-8">
            <YarnLight className="w-16 h-16 mb-4 block dark:hidden" />
            <YarnDark className="w-16 h-16 mb-4 block hidden dark:block" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileLoginPage;
