"use client";

import Link from "next/link";
import React, { Suspense } from "react";

import URLMessage from "@/components/ui/URLMessage";

const AuthCodeError: React.FC = () => {
  return (
    <Suspense>
      <div className="flex flex-col h-dvh justify-center items-center">
        <h2 className="text-xl">Oops!</h2>
        <URLMessage />
        <Link href="/">Return home</Link>
      </div>
    </Suspense>
  );
};

export default AuthCodeError;
