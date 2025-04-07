declare module "@app/globals.css";

declare module "*.svg" {
  import { FC, SVGProps } from "react";

  const content: FC<SVGProps<SVGElement>>;
  export default content;
}

declare module "*.svg?url" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content: any;
  export default content;
}

declare module "@fontsource/noto-sans";
declare module "@fontsource/noto-serif";
declare module "@fontsource/noto-sans-mono";
declare module "@fontsource/noto-sans-arabic";
declare module "@fontsource/noto-naskh-arabic";
declare module "@fontsource/noto-kufi-arabic";
