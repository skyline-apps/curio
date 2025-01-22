import React from "react";
import { HiChevronLeft } from "react-icons/hi2";

import Button from "@/components/Button";
import { CurioBrand, CurioLogo } from "@/components/CurioBrand";
import Icon from "@/components/Icon";
import { cn } from "@/utils/cn";

interface SidebarHeaderProps {
  sidebarOpen: boolean;
  onToggle: () => void;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  sidebarOpen,
  onToggle,
}) => {
  return (
    <div
      className={cn(
        "flex h-16 gap-2 items-center",
        sidebarOpen ? "justify-center md:justify-between" : "justify-center",
      )}
    >
      <div
        className={cn("transition-opacity duration-300 ml-4", {
          "opacity-100 hidden md:block": sidebarOpen,
          "opacity-0 w-0 hidden md:hidden": !sidebarOpen,
        })}
      >
        <CurioBrand />
      </div>
      <Button
        isIconOnly
        variant="light"
        onPress={onToggle}
        aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        className={cn(
          "mt-2",
          sidebarOpen ? "hidden md:mr-2 md:flex" : "hidden md:flex",
        )}
      >
        <Icon icon={sidebarOpen ? <HiChevronLeft /> : <CurioLogo />} />
      </Button>
      <div className="block md:hidden mt-2 w-10 h-10">
        <Icon className="block md:hidden" icon={<CurioLogo />} />
      </div>
    </div>
  );
};

export default SidebarHeader;
