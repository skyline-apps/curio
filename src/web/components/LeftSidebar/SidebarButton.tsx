import React from "react";

import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";

interface SidebarButtonProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  isSelected?: boolean;
}

const SidebarButton: React.FC<SidebarButtonProps> = ({
  icon,
  label,
  onPress,
  isSelected = false,
}) => {
  return (
    <Button
      isIconOnly
      variant={isSelected ? "solid" : "light"}
      onPress={onPress}
      aria-label={label}
      className="mx-2"
    >
      <Icon icon={icon} />
    </Button>
  );
};

export default SidebarButton;
