"use client";

import React from "react";

import GoogleSignIn from "@/components/GoogleSignIn";

interface LoginPageProps {}

const LoginPage: React.FC<LoginPageProps> = ({}: LoginPageProps) => {
  return (
    <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
      <h1 className="text-2xl font-medium">Log in</h1>
      <GoogleSignIn nextUrl="/home" />
    </div>
  );
};

export default LoginPage;
