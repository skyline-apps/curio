import Spinner from "@app/components/ui/Spinner";
import { Tooltip } from "@app/components/ui/Tooltip";
import { cn } from "@app/utils/cn";
import { Button, ButtonProps } from "@heroui/react";
import React, { forwardRef, useState } from "react";
import { useNavigate } from "react-router-dom";

interface CurioButtonProps extends Omit<ButtonProps, "size" | "spinner"> {
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
    const navigate = useNavigate();

    const isLoading = props.isLoading || pressed;
    const buttonProps: ButtonProps = {
      ...props,
      className: cn(
        "relative",
        {
          "text-xs px-1 py-1 min-w-6 h-6": size === "xs",
          [props.isIconOnly ? "w-6" : ""]: size === "xs",
          "bg-background-400 dark:bg-background hover:bg-background-300 dark:hover:bg-background-400 border-none shadow":
            props.variant === "faded",
          "opacity-70 border-none shadow data-[hover=true]:!bg-transparent data-[hover=true]:opacity-100 shadow-none":
            props.variant === "ghost",
          "text-default-900": props.color === "secondary",
        },
        className,
      ),
      size: size === "xs" ? undefined : size,
      isLoading: false,
      disabled: isLoading,
    };
    const spinner = isLoading ? (
      <Spinner
        color={
          props.color === "warning" || props.color === "secondary"
            ? "dark"
            : "light"
        }
        size={size === "xs" ? "xs" : "sm"}
      />
    ) : undefined;

    if (isLoading) {
      buttonProps.children = (
        <>
          <div className="opacity-0">{props.children}</div>
          <div className="absolute inset-0 flex items-center justify-center">
            {spinner}
          </div>
        </>
      );
    }

    if (href) {
      const handlePress = (): void => {
        setPressed(true);
        if (href.startsWith("http")) {
          window.location.href = href;
        } else {
          navigate(href);
        }
        setPressed(false);
      };
      innerContent = (
        <Button
          ref={ref}
          {...buttonProps}
          isLoading={buttonProps.isLoading}
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
