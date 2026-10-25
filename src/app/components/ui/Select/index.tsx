import { INPUT_BG_CLASSES, INPUT_CLASSES } from "@app/components/ui/Input";
import { cn } from "@app/utils/cn";
import {
  Select as HerouiSelect,
  type SelectProps as HerouiSelectProps,
} from "@heroui/react";
import React from "react";

export { SelectItem, SelectSection } from "@heroui/react";

export interface CurioSelectProps<T extends object = object>
  extends HerouiSelectProps<T> {
  transparent?: boolean;
  contrast?: boolean; // Contrast against default bg-background color
}

export const Select = <T extends object = object>({
  transparent,
  contrast,
  className,
  classNames,
  size = "sm",
  ...props
}: CurioSelectProps<T>): React.ReactElement => {
  const triggerBg = transparent
    ? "bg-transparent hover:bg-transparent data-[hover=true]:bg-transparent group-data-[focus=true]:bg-transparent"
    : contrast
      ? INPUT_BG_CLASSES
      : INPUT_CLASSES;

  return (
    <HerouiSelect<T>
      size={size}
      className={className}
      classNames={{
        ...classNames,
        trigger: cn(triggerBg, classNames?.trigger),
      }}
      {...props}
    />
  );
};

export default Select;
