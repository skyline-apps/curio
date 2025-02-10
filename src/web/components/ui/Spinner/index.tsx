import { Spinner, SpinnerProps } from "@heroui/react";

interface CurioSpinnerProps extends Omit<SpinnerProps, "size"> {
  centered?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
}

const CurioSpinner: React.FC<CurioSpinnerProps> = ({
  centered = false,
  size = "md",
  className,
  color = "secondary",
  classNames,
  ...props
}: CurioSpinnerProps) => {
  const spinnerProps: SpinnerProps = {
    color,
    className,
    classNames:
      size === "xs"
        ? {
            wrapper: "w-4 h-4",
            circle1: "border-2",
            circle2: "border-2",
            ...classNames,
          }
        : classNames,
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
