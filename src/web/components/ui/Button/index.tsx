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
  "data-testid"?: string;
}

// Add forwardRef to ensure Dropdowns are properly positioned.
const CurioButton = forwardRef<HTMLButtonElement, CurioButtonProps>(
  (
    { href, tooltip, size = "md", className, ...props }: CurioButtonProps,
    ref,
  ) => {
    let innerContent: React.ReactNode;

    const buttonProps: ButtonProps = {
      ...props,
      className: cn(
        {
          "text-xs px-1 py-1 min-w-6 h-6": size === "xs",
          [props.isIconOnly ? "w-6" : ""]: size === "xs",
          "bg-background-400 dark:bg-background hover:bg-background-300 dark:hover:bg-background-400 border-none shadow":
            props.variant === "faded",
        },
        className,
      ),
      size: size === "xs" ? undefined : size,
      spinner:
        size === "xs" && props.isLoading ? (
          <Spinner size="xs" />
        ) : (
          props.spinner
        ),
    };

    if (href) {
      innerContent = (
        <Link
          href={href}
          passHref
          data-testid={props["data-testid"] || "button"}
        >
          <Button ref={ref} {...buttonProps} />
        </Link>
      );
    } else {
      innerContent = (
        <Button
          ref={ref}
          {...buttonProps}
          data-testid={props["data-testid"] || "button"}
        />
      );
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
