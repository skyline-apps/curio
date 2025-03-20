"use client";

import { Button, ButtonProps } from "@heroui/react";
import { useRouter } from "next/navigation";
import React, { forwardRef, useState } from "react";
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
    const [pressed, setPressed] = useState<boolean>(false);
    let innerContent: React.ReactNode;
    const router = useRouter();

    const buttonProps: ButtonProps = {
      ...props,
      className: cn(
        {
          "text-xs px-1 py-1 min-w-6 h-6": size === "xs",
          [props.isIconOnly ? "w-6" : ""]: size === "xs",
          "bg-background-400 dark:bg-background hover:bg-background-300 dark:hover:bg-background-400 border-none shadow":
            props.variant === "faded",
          "opacity-70 border-none shadow data-[hover=true]:!bg-transparent data-[hover=true]:opacity-100":
            props.variant === "ghost",
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
      const handlePress = (): void => {
        setPressed(true);
        router.push(href);
      };
      innerContent = (
        <Button
          ref={ref}
          {...buttonProps}
          isLoading={pressed || buttonProps.isLoading}
          onPress={handlePress}
          data-testid={props["data-testid"] || "button"}
        />
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
      <Tooltip delay={1000} closeDelay={0} content={tooltip}>
        {innerContent}
      </Tooltip>
    ) : (
      innerContent
    );
  },
);
CurioButton.displayName = "CurioButton";

export default CurioButton;
