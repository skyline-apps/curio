import { Input, InputProps } from "@nextui-org/react";
import React from "react";

const CurioInput: React.FC<InputProps> = (props: InputProps) => {
  return (
    <Input
      size="sm"
      classNames={{
        inputWrapper:
          "bg-default-100 dark:bg-default hover:bg-default-200 group-data-[focus=true]:bg-default-200 dark:hover:bg-default-700 dark:group-data-[focus=true]:bg-default-700",
      }}
      {...props}
    />
  );
};

export default CurioInput;
