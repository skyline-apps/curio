"use client";
import React, { useContext } from "react";

import AppPage from "@/components/AppPage";
import { UserContext } from "@/providers/UserProvider";

const HomePage: React.FC = () => {
  const { user } = useContext(UserContext);

  return (
    <AppPage>
      <div className="flex-1 w-full flex flex-col gap-12">
        <div className="w-full">
          <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
            This is a protected page that you can only see as an authenticated
            user
          </div>
        </div>
        <div className="flex flex-col gap-2 items-start">
          <h2 className="font-bold text-2xl mb-4">Your user details</h2>
          <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
        <p className="font-sans">
          This is a long block of sans serif font. Lorem ipsum dolor sit amet
          consectetur adipisicing elit.
        </p>
        <p className="font-serif">
          This is a long block of serif font. Lorem ipsum dolor sit amet
          consectetur adipisicing elit.
        </p>
        <p className="font-mono">
          This is a long block of mono font. Lorem ipsum dolor sit amet
          consectetur adipisicing elit.
        </p>
        <p className="font-sans">
          This is a long block of sans serif font. Lorem ipsum dolor sit amet
          consectetur adipisicing elit.
        </p>
        <p className="font-serif">
          This is a long block of serif font. Lorem ipsum dolor sit amet
          consectetur adipisicing elit.
        </p>
        <p className="font-mono">
          This is a long block of mono font. Lorem ipsum dolor sit amet
          consectetur adipisicing elit.
        </p>
        <p className="font-sans">
          This is a long block of sans serif font. Lorem ipsum dolor sit amet
          consectetur adipisicing elit.
        </p>
        <p className="font-serif">
          This is a long block of serif font. Lorem ipsum dolor sit amet
          consectetur adipisicing elit.
        </p>
        <p className="font-mono">
          This is a long block of mono font. Lorem ipsum dolor sit amet
          consectetur adipisicing elit.
        </p>
        <div className="flex flex-row gap-2 items-start">
          <div className="w-48 h-48 bg-primary">Primary</div>
          <div className="w-48 h-48 bg-secondary">Secondary</div>
          <div className="w-48 h-48 bg-success">Success</div>
          <div className="w-48 h-48 bg-warning">Warning</div>
          <div className="w-48 h-48 bg-danger">Danger</div>
        </div>
        <p className="font-sans">
          This is a long block of sans serif font. Lorem ipsum dolor sit amet
          consectetur adipisicing elit.
        </p>
        <p className="font-serif">
          This is a long block of serif font. Lorem ipsum dolor sit amet
          consectetur adipisicing elit.
        </p>
        <p className="font-mono">
          This is a long block of mono font. Lorem ipsum dolor sit amet
          consectetur adipisicing elit.
        </p>
      </div>
    </AppPage>
  );
};

export default HomePage;
