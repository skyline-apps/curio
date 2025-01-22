import React from "react";
import { IconContext } from "react-icons";

import { cn } from "@/utils/cn";

interface IconProps {
  className?: string;
  icon: React.ReactNode;
}

const Icon: React.FC<IconProps> = ({ className, icon }: IconProps) => {
  return (
    <IconContext.Provider
      value={{ className: cn("text-foreground", className) }}
    >
      {icon}
    </IconContext.Provider>
  );
};

export default Icon;
