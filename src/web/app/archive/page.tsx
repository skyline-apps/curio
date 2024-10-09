"use client";
import React from "react";

import AppPage from "@/components/AppPage";

const ArchivePage: React.FC = () => {
  return (
    <AppPage>
      <div className="flex-1 w-full flex flex-col gap-12">
        <div className="w-full">
          <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
            archive
          </div>
        </div>
      </div>
    </AppPage>
  );
};

export default ArchivePage;
