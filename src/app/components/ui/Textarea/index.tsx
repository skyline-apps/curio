import Button from "@app/components/ui/Button";
import { Textarea, type TextAreaProps } from "@heroui/react";
import { INPUT_CLASSES } from "components/ui/Input";
import { useState } from "react";
import {
  HiOutlineCheckCircle,
  HiOutlinePencil,
  HiOutlineXCircle,
} from "react-icons/hi2";
import { cn } from "utils/cn";

interface CurioTextareaProps extends TextAreaProps {
  onSave?: () => Promise<void>;
}

const CurioTextarea = ({
  classNames,
  ...props
}: CurioTextareaProps): React.ReactElement => {
  const [editable, setEditable] = useState<boolean>(props.value === "");
  const [loading, setLoading] = useState<boolean>(false);
  const textAreaProps = { ...props };
  textAreaProps.isClearable = false;
  textAreaProps.onClear = undefined;
  let extraElements = null;

  if (props.onSave) {
    textAreaProps.disabled = !editable;
    if (!editable) {
      extraElements = (
        <>
          <Button
            size="sm"
            isIconOnly
            tooltip="Edit"
            disableRipple
            variant="ghost"
            onPress={() => setEditable(true)}
          >
            <HiOutlinePencil size={18} />
          </Button>
        </>
      );
    } else {
      extraElements = (
        <>
          <Button
            size="sm"
            isIconOnly
            tooltip="Clear"
            disableRipple
            className={cn(
              "relative -end-2",
              props.onClear ? "visible" : "hidden",
            )}
            variant="ghost"
            onPress={() => props.onClear?.()}
          >
            <HiOutlineXCircle size={20} />
          </Button>
          <Button
            size="sm"
            isIconOnly
            tooltip="Save"
            disableRipple
            variant="ghost"
            onPress={async () => {
              setLoading(true);
              props.onSave?.().then(() => {
                setEditable(false);
                setLoading(false);
              });
            }}
            isLoading={loading}
          >
            <HiOutlineCheckCircle size={20} />
          </Button>
        </>
      );
    }
  }

  return (
    <Textarea
      classNames={{
        inputWrapper: cn(INPUT_CLASSES, "border border-background-600"),
        ...classNames,
      }}
      endContent={<div className="absolute top-0 end-0">{extraElements}</div>}
      {...textAreaProps}
    />
  );
};

export default CurioTextarea;
