"use client";

import { useRouter } from "next/navigation";
import React, { useContext } from "react";

import EmailSignIn from "@/components/Auth/EmailSignIn";
import GoogleSignIn from "@/components/Auth/GoogleSignIn";
import Spinner from "@/components/ui/Spinner";
import { UserContext } from "@/providers/UserProvider";
import YarnDark from "@/public/assets/yarn_dark.svg";
import YarnLight from "@/public/assets/yarn_light.svg";

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
      </div>
    </div>
  );
};

export default LoginPage;
