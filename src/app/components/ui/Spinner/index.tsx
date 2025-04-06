import { cn } from "@app/utils/cn";
import { Spinner, SpinnerProps } from "@heroui/react";

interface CurioSpinnerProps extends Omit<SpinnerProps, "size" | "color"> {
  centered?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  color?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "light"
    | "dark";
}

const CurioSpinner: React.FC<CurioSpinnerProps> = ({
  centered = false,
  size = "md",
  className,
  color = "secondary",
  classNames,
  ...props
}: CurioSpinnerProps) => {
  const isDark = color === "dark";
  const isLight = color === "light";
  const spinnerProps: SpinnerProps = {
    color: isLight || isDark ? "default" : color,
    className,
    classNames: {
      wrapper: cn(size === "xs" && "w-4 h-4"),
      circle1: cn(
        isDark && "border-b-default",
        isLight && "border-b-default-100",
        size === "xs" && "border-2",
      ),
      circle2: cn(
        isDark && "border-b-default",
        isLight && "border-b-default-100",
        size === "xs" && "border-2",
      ),
      ...classNames,
    },
    size: size === "xs" ? undefined : size,
  };

  const spinner = <Spinner {...spinnerProps} {...props} />;
  if (centered) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        {spinner}
      </div>
    );
  }
  return spinner;
};

export default CurioSpinner;
