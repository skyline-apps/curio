import React from "react";
import { IconContext } from "react-icons";

interface IconProps {
  className?: string;
  icon: React.ReactNode;
}

const Icon: React.FC<IconProps> = ({ className, icon }: IconProps) => {
  return (
    <IconContext.Provider value={{ className: className }}>
      {icon}
    </IconContext.Provider>
  );
};

export default Icon;
