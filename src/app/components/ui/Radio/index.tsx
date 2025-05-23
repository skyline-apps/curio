import { Radio, RadioGroup, RadioProps } from "@heroui/react";

const CurioRadio: React.FC<RadioProps> = (props: RadioProps) => {
  return <Radio size="sm" {...props} />;
};

export { RadioGroup };
export { CurioRadio as Radio };
