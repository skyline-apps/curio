import React from "react";

import Button from "@/components/Button";
import Icon from "@/components/Icon";

interface SidebarButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isSelected?: boolean;
}

const SidebarButton: React.FC<SidebarButtonProps> = ({
  icon,
  label,
  onClick,
  isSelected = false,
}) => {
  return (
    <Button
      isIconOnly
      variant={isSelected ? "solid" : "light"}
      onClick={onClick}
      aria-label={label}
      className="w-full"
    >
      <Icon icon={icon} />
    </Button>
  );
};

export default SidebarButton;
