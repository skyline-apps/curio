"use client";

import EmailSignIn from "@web/components/Auth/EmailSignIn";
import GoogleSignIn from "@web/components/Auth/GoogleSignIn";
import Spinner from "@web/components/ui/Spinner";
import { UserContext } from "@web/providers/UserProvider";
import YarnDark from "@web/public/assets/yarn_dark.svg";
import YarnLight from "@web/public/assets/yarn_light.svg";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useContext } from "react";

interface LoginPageProps {}

const LoginPage: React.FC<LoginPageProps> = ({}: LoginPageProps) => {
  const { user } = useContext(UserContext);
  const router = useRouter();
  if (user && user.id) {
    // Already signed in; redirect to home
    router.push("/home");
    return <Spinner centered />;
  }

  return (
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
          <Link className="hover:underline" href="/terms" target="_blank">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link className="hover:underline" href="/privacy" target="_blank">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
