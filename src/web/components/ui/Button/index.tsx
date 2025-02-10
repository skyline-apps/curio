"use client";

import { Button, ButtonProps } from "@heroui/react";
import Link from "next/link";
import React, { forwardRef } from "react";
import { useFormStatus } from "react-dom";

import Spinner from "@/components/ui/Spinner";
import { Tooltip } from "@/components/ui/Tooltip";
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

interface CurioButtonProps extends Omit<ButtonProps, "size"> {
  href?: string;
  tooltip?: string;
  size?: "xs" | "sm" | "md" | "lg";
}

// Add forwardRef to ensure Dropdowns are properly positioned.
const CurioButton = forwardRef<HTMLButtonElement, CurioButtonProps>(
  ({ href, tooltip, size = "md", ...props }: CurioButtonProps, ref) => {
    let innerContent: React.ReactNode;

    if (props.variant === "faded") {
      props.className = cn(
        "bg-background-400 dark:bg-background hover:bg-background-300 dark:hover:bg-background-400 border-none shadow",
        props.className,
      );
    }
    if (size === "xs") {
      props.className = cn("text-xs px-1 py-1 min-w-6 h-6", props.className);
      if (props.isIconOnly) {
        props.className = cn("w-6", props.className);
      }
      if (props.isLoading) {
        props.spinner = <Spinner size="xs" />;
      }
    }
    if (href) {
      innerContent = (
        <Link href={href} passHref>
          <Button ref={ref} {...props} />
        </Link>
      );
    } else {
      innerContent = <Button ref={ref} {...props} />;
    }

    return tooltip ? (
      <Tooltip delay={2000} closeDelay={0} content={tooltip}>
        {innerContent}
      </Tooltip>
    ) : (
      innerContent
    );
  },
);
CurioButton.displayName = "CurioButton";

export default CurioButton;
