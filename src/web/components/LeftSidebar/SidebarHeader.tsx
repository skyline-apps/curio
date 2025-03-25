import React from "react";

import { CurioBrand, CurioHomeLogo } from "@web/components/CurioBrand";
import { cn } from "@web/utils/cn";

interface SidebarHeaderProps {
  sidebarOpen: boolean;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ sidebarOpen }) => {
  return (
    <div
      className={cn(
        "flex h-16 gap-2 items-center",
        sidebarOpen ? "justify-center md:justify-between" : "justify-center",
      )}
    >
      <div className="transition-opacity duration-300 opacity-100 hidden md:block">
        {sidebarOpen ? <CurioBrand className="ml-4 mt-4" /> : <CurioHomeLogo />}
      </div>
      <div className="block md:hidden mt-2">
        <CurioHomeLogo />
      </div>
    </div>
  );
};

export default SidebarHeader;
