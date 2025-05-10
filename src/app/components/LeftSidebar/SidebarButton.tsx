import Button from "@app/components/ui/Button";
import Icon from "@app/components/ui/Icon";
import React from "react";

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
      variant={isSelected ? "flat" : "light"}
      onPress={onPress}
      aria-label={label}
    >
      <Icon icon={icon} />
    </Button>
  );
};

export default SidebarButton;
