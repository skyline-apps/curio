import { Input, InputProps } from "@heroui/react";
import React from "react";

const CurioInput: React.FC<InputProps> = ({
  className,
  ...props
}: InputProps) => {
  return (
    <Input
      size="sm"
      classNames={{
        inputWrapper: `bg-default-50 dark:bg-default-950 hover:bg-default-75 data-[hover=true]:bg-default-75 group-data-[focus=true]:bg-default-75 dark:hover:bg-default-975 dark:group-data-[focus=true]:bg-default-975 dark:data-[hover=true]:bg-default-975 ${className}`,
        input: "placeholder:text-secondary-400",
      }}
      {...props}
    />
  );
};

export default CurioInput;
