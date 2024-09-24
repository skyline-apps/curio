"use client";

import { Button, ButtonProps } from "@nextui-org/react";
import { useFormStatus } from "react-dom";

interface FormButtonProps extends ButtonProps {
  pendingText?: string;
}

export const FormButton: React.FC<FormButtonProps> = ({
  children,
  pendingText,
  ...props
}: FormButtonProps) => {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" aria-disabled={pending} {...props}>
      {pending ? pendingText : children}
    </Button>
  );
};

export default Button;
