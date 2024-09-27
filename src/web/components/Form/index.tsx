import React from "react";

import { cn } from "@/utils/cn";

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

const Form: React.FC<FormProps> = ({
  className,
  children,
  ...props
}: FormProps) => {
  return (
    <form {...props} className={cn("flex flex-col gap-2", className)}>
      {children}
    </form>
  );
};

export default Form;
