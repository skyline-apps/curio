import { Switch, SwitchProps } from "@heroui/react";

import { cn } from "@/utils/cn";

interface CurioSwitchProps extends Omit<SwitchProps, "size"> {
  size?: "xs" | "sm" | "md" | "lg";
}

const CurioSwitch: React.FC<CurioSwitchProps> = ({
  size,
  ...props
}: CurioSwitchProps) => {
  const newProps: SwitchProps = { ...props };
  const classNames = props.classNames || {};
  classNames.wrapper = cn(
    classNames?.wrapper,
    "bg-default-50 dark:bg-default-950",
  );
  if (size === "xs") {
    classNames.wrapper = cn(classNames?.wrapper, "h-4 w-8");
    classNames.thumb = cn(
      classNames?.thumb,
      "group-data-[selected=true]:ms-3 group-data-[pressed=true]:w-4 group-data-[selected]:group-data-[pressed]:ml-2 h-3 w-3",
    );
    classNames.label = cn(classNames?.label, "text-xs");
    newProps.size = undefined;
  } else if (!size) {
    newProps.size = "sm";
  } else {
    newProps.size = size;
  }
  newProps.classNames = classNames;
  return <Switch {...newProps} />;
};

export { CurioSwitch as Switch };
