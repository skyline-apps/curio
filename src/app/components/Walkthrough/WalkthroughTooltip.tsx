import Button from "@app/components/ui/Button";
import Icon from "@app/components/ui/Icon";
import type { WalkthroughStep } from "@app/providers/Walkthrough";
import type { Step, TooltipRenderProps } from "react-joyride";

function isWalkthroughStep(step: Step): step is WalkthroughStep {
  return typeof step === "object" && step !== null && "icon" in step;
}

export const WalkthroughTooltip = ({
  backProps,
  skipProps,
  primaryProps,
  index,
  isLastStep,
  step,
  size,
}: TooltipRenderProps): JSX.Element => {
  return (
    <div className="bg-background dark:bg-background-600 border border-divider rounded shadow-2xl m-4 p-6 min-w-[300px] sm:w-[400px]">
      <div className="flex gap-3 items-center mb-4">
        <Icon
          className="animate-pulse"
          icon={
            isWalkthroughStep(step as Step)
              ? (step as WalkthroughStep).icon
              : undefined
          }
        />
        <h2 className="font-semibold">{step.title}</h2>
      </div>
      <div className="text-sm mb-8 flex flex-col gap-2">{step.content}</div>
      <div className="flex gap-2 justify-between w-full">
        <Button
          size="sm"
          variant="flat"
          color="danger"
          onClick={skipProps.onClick}
        >
          Skip intro
        </Button>
        <div className="flex gap-2">
          {index > 0 && (
            <Button size="sm" variant="ghost" onClick={backProps.onClick}>
              Back
            </Button>
          )}
          <Button
            size="sm"
            variant="solid"
            color="success"
            onClick={primaryProps.onClick}
          >
            {isLastStep ? "Finish" : `Next (${index + 1}/${size})`}
          </Button>
        </div>
      </div>
    </div>
  );
};
