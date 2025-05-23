import { createContext, useContext } from "react";
import type { CallBackProps, Step } from "react-joyride";

export type WalkthroughStep = Step & {
  icon?: React.ReactNode;
};

export interface WalkthroughContextValue {
  run: boolean;
  setRun: (run: boolean) => void;
  stepIndex: number;
  setStepIndex: (idx: number) => void;
  steps: WalkthroughStep[];
  handleJoyrideCallback: (data: CallBackProps) => void;
}

export const WalkthroughContext = createContext<WalkthroughContextValue>({
  run: false,
  setRun: () => {},
  stepIndex: 0,
  setStepIndex: () => {},
  steps: [],
  handleJoyrideCallback: () => {},
});

export function useWalkthrough(): WalkthroughContextValue {
  const context = useContext(WalkthroughContext);
  return context;
}
