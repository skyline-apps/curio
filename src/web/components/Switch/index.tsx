import { Switch, SwitchProps } from "@nextui-org/react";

const CurioSwitch: React.FC<SwitchProps> = (props: SwitchProps) => {
  return <Switch size="sm" {...props} />;
};

export { CurioSwitch as Switch };
