"use client";

import URLMessage from "@web/components/ui/URLMessage";
import Link from "next/link";
import React, { Suspense } from "react";

const AuthCodeError: React.FC = () => {
  return (
    <Suspense>
      <div className="flex flex-col h-dvh justify-center items-center gap-4">
        <h2 className="text-xl">Oops!</h2>
        <URLMessage fallbackMessage="Something went wrong." />
        <Link className="underline" href="/">
          Return home.
        </Link>
      </div>
    </Suspense>
  );
};

export default AuthCodeError;
