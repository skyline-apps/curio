"use client";

import { Button, ButtonProps, Spinner } from "@nextui-org/react";
import React, { forwardRef } from "react";
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
  const loadingContent = pendingText ? <Spinner /> : null;
  return (
    <Button type="submit" aria-disabled={pending} {...props}>
      {pending ? loadingContent : children}
    </Button>
  );
};

interface CurioButtonProps extends ButtonProps {
  href?: string;
}

// Add forwardRef to ensure Dropdowns are properly positioned.
const CurioButton: React.FC<CurioButtonProps> = forwardRef(
  ({ href, ...props }: CurioButtonProps, ref) => {
    if (href) {
      return (
        <Link href={href}>
          <Button ref={ref} {...props} />
        </Link>
      );
    }
    return <Button ref={ref} {...props} />;
  },
);
CurioButton.displayName = "CurioButton";

export default CurioButton;
