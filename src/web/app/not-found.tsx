"use client";
import React from "react";

const NotFound: React.FC = ({}) => {
  return (
    <div className="flex flex-col h-dvh justify-center items-center">
      <h2 className="text-xl">Oops!</h2>
      <p>Page not found</p>
    </div>
  );
};

export default NotFound;
