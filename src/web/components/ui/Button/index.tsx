"use client";

import { Button, ButtonProps } from "@heroui/react";
import Link from "next/link";
import React, { forwardRef } from "react";
import { useFormStatus } from "react-dom";

import { cn } from "@/utils/cn";

interface FormButtonProps extends ButtonProps {
  pendingText?: string;
}

export const FormButton: React.FC<FormButtonProps> = ({
  children,
  pendingText,
  ...props
}: FormButtonProps) => {
  const { pending } = useFormStatus();
  const loadingText = pendingText || "Loading...";
  return (
    <Button
      isLoading={pending}
      type="submit"
      aria-disabled={pending}
      {...props}
    >
      {pending ? loadingText : children}
    </Button>
  );
};

interface CurioButtonProps extends ButtonProps {
  href?: string;
}

// Add forwardRef to ensure Dropdowns are properly positioned.
const CurioButton = forwardRef<HTMLButtonElement, CurioButtonProps>(
  ({ href, ...props }: CurioButtonProps, ref) => {
    if (props.variant === "faded") {
      props.className = cn(
        "bg-background-400 dark:bg-background hover:bg-background-300 dark:hover:bg-background-400 border-none shadow",
        props.className,
      );
    }
    if (href) {
      return (
        <Link href={href} passHref>
          <Button ref={ref} {...props} />
        </Link>
      );
    }
    return <Button ref={ref} {...props} />;
  },
);
CurioButton.displayName = "CurioButton";

export default CurioButton;
