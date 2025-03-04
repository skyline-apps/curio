import { Switch, SwitchProps } from "@heroui/react";

const CurioSwitch: React.FC<SwitchProps> = (props: SwitchProps) => {
  return (
    <Switch
      size="sm"
      classNames={{ wrapper: "bg-default-50 dark:bg-default-950" }}
      {...props}
    />
  );
};

export { CurioSwitch as Switch };
