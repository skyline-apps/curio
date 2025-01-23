import { Switch, SwitchProps } from "@heroui/react";

const CurioSwitch: React.FC<SwitchProps> = (props: SwitchProps) => {
  return <Switch size="sm" {...props} />;
};

export { CurioSwitch as Switch };
