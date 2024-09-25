"use client";

import { Button, ButtonProps } from "@nextui-org/react";
import Link from "next/link";
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

interface CurioButtonProps extends ButtonProps {
  href?: string;
}

const CurioButton: React.FC<CurioButtonProps> = ({
  href,
  ...props
}: CurioButtonProps) => {
  if (href) {
    return (
      <Link href={href}>
        <Button {...props} />
      </Link>
    );
  }
  return <Button {...props} />;
};

export default CurioButton;
