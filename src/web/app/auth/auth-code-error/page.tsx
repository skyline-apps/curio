"use client";

import Link from "next/link";
import React from "react";
import { useSearchParams } from "next/navigation";

const AuthCodeError: React.FC = () => {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  return (
    <div className="flex flex-col h-dvh justify-center items-center">
      <h2 className="text-xl">Oops!</h2>
      <p>{message || "Something went wrong."}</p>
      <Link href="/">Return home</Link>
    </div>
  );
};

export default AuthCodeError;
