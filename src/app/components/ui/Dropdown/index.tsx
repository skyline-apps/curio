import {
  Dropdown as HerouiDropdown,
  type DropdownProps as HerouiDropdownProps,
} from "@heroui/dropdown";
import React from "react";

export {
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
} from "@heroui/dropdown";

export type DropdownProps = HerouiDropdownProps;

export const Dropdown: React.FC<DropdownProps> = ({
  shouldBlockScroll = false,
  disableAnimation = true,
  ...props
}: DropdownProps) => {
  return (
    <HerouiDropdown
      shouldBlockScroll={shouldBlockScroll}
      disableAnimation={disableAnimation}
      {...props}
    />
  );
};

export default Dropdown;
