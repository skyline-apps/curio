import { Textarea, type TextAreaProps } from "@heroui/react";
import { INPUT_CLASSES } from "components/ui/Input";
import { cn } from "utils/cn";

interface CurioTextareaProps extends TextAreaProps {}

const CurioTextarea = ({
  classNames,
  ...props
}: CurioTextareaProps): React.ReactElement => {
  return (
    <Textarea
      classNames={{
        inputWrapper: cn(INPUT_CLASSES, "border border-background-600"),
        ...classNames,
      }}
      {...props}
    />
  );
};

export default CurioTextarea;
