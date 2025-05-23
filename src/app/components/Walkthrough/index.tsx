import { useUser } from "@app/providers/User";
import { useWalkthrough } from "@app/providers/Walkthrough";
import Joyride from "react-joyride";

import { WalkthroughTooltip } from "./WalkthroughTooltip";

export const Walkthrough = (): JSX.Element | null => {
  const { user } = useUser();
  const { run, stepIndex, steps, handleJoyrideCallback } = useWalkthrough();

  if (!user?.id) return null;
  if (!run) return null;

  return (
    <Joyride
      key={`joyride-${stepIndex}`}
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      callback={handleJoyrideCallback}
      continuous
      showSkipButton
      showProgress
      scrollToFirstStep
      disableOverlayClose
      disableCloseOnEsc
      spotlightClicks
      tooltipComponent={WalkthroughTooltip}
      floaterProps={{ hideArrow: true }}
    />
  );
};
