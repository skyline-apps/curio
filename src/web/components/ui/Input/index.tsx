import { Input, InputProps } from "@heroui/react";
import React from "react";

export const INPUT_CLASSES =
  "bg-default-50 dark:bg-default-950 hover:bg-default-75 data-[hover=true]:bg-default-75 group-data-[focus=true]:bg-default-75 dark:hover:bg-default-975 dark:group-data-[focus=true]:bg-default-975 dark:data-[hover=true]:bg-default-975";
const INPUT_BG_CLASSES =
  "bg-default-25 dark:bg-default-925 hover:bg-default-75 data-[hover=true]:bg-default-75 group-data-[focus=true]:bg-default-75 dark:hover:bg-default-975 dark:group-data-[focus=true]:bg-default-975 dark:data-[hover=true]:bg-default-975";

interface CurioInputProps extends InputProps {
  transparent?: boolean;
  contrast?: boolean; // Contrast against default bg-background color
}

const CurioInput: React.FC<CurioInputProps> = ({
  transparent,
  contrast,
  className,
  ...props
}: CurioInputProps) => {
  return (
    <Input
      size="sm"
      classNames={{
        inputWrapper: `${transparent ? "bg-transparent hover:bg-transparent data-[hover=true]:bg-transparent group-data-[focus=true]:bg-transparent" : contrast ? INPUT_BG_CLASSES : INPUT_CLASSES} ${className}`,
        input:
          "placeholder:text-secondary-400 dark:placeholder:text-secondary-900",
      }}
      {...props}
    />
  );
};

export default CurioInput;
