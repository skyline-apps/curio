import Button from "@web/components/ui/Button";
import Icon from "@web/components/ui/Icon";
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
      className="mx-2"
    >
      <Icon icon={icon} />
    </Button>
  );
};

export default SidebarButton;
