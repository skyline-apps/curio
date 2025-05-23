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
        <button
          className="z-0 group inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap font-normal subpixel-antialiased overflow-hidden tap-highlight-transparent data-[pressed=true]:scale-[0.97] outline-none focus:z-10 px-3 min-w-16 h-8 text-tiny gap-2 rounded-small [&>svg]:max-w-[theme(spacing.8)] transition-transform-colors-opacity motion-reduce:transition-none bg-danger/20 text-danger-600 dark:text-danger-500 hover:opacity-hover relative"
          onClick={skipProps.onClick}
        >
          Skip intro
        </button>
        <div className="flex gap-2">
          {index > 0 && (
            <button
              className="z-0 group inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap font-normal subpixel-antialiased overflow-hidden tap-highlight-transparent data-[pressed=true]:scale-[0.97] outline-none border-medium bg-transparent px-3 min-w-16 h-8 text-tiny gap-2 rounded-small [&>svg]:max-w-[theme(spacing.8)] transition-transform-colors-opacity motion-reduce:transition-none border-default text-default-foreground relative opacity-70 border-none hover:!bg-transparent hover:opacity-100 shadow-none"
              onClick={backProps.onClick}
            >
              Back
            </button>
          )}
          <button
            className="z-0 group inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap font-normal subpixel-antialiased overflow-hidden tap-highlight-transparent data-[pressed=true]:scale-[0.97] outline-none px-3 min-w-16 h-8 text-tiny gap-2 rounded-small [&>svg]:max-w-[theme(spacing.8)] transition-transform-colors-opacity motion-reduce:transition-none bg-success text-success-foreground hover:opacity-hover relative"
            onClick={primaryProps.onClick}
          >
            {isLastStep ? "Finish" : `Next (${index + 1}/${size})`}
          </button>
        </div>
      </div>
    </div>
  );
};
