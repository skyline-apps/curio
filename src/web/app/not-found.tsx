"use client";
import Link from "next/link";
import React from "react";

const NotFound: React.FC = ({}) => {
  return (
    <div className="flex flex-col h-dvh justify-center items-center gap-4">
      <h2 className="text-xl">Oops!</h2>
      <p>Page not found</p>
      <Link className="underline" href="/">
        Return home.
      </Link>
    </div>
  );
};

export default NotFound;
