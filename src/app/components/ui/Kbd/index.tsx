import { Kbd, type KbdProps } from "@heroui/react";
import { cn } from "utils/cn";

export { type KbdKey } from "@heroui/react";

type CurioKbdProps = KbdProps;

const CurioKbd = ({
  className,
  ...props
}: CurioKbdProps): React.ReactElement => {
  return <Kbd className={cn("bg-background-700", className)} {...props}></Kbd>;
};

export default CurioKbd;
