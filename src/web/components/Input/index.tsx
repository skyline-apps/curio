import { Input, InputProps } from "@nextui-org/react";
import React from "react";

const CurioInput: React.FC<InputProps> = (props: InputProps) => {
  return <Input size="sm" {...props} />;
};

export default CurioInput;
