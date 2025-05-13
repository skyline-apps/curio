import {
  Tooltip as HeroTooltip,
  TooltipProps as HeroTooltipProps,
} from "@heroui/react";
import React, { useCallback, useRef } from "react";

export interface TooltipProps extends HeroTooltipProps {
  /** Enable long press to show tooltip. If a number, sets the delay in ms (default: 500ms). */
  longPress?: boolean | number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  longPress = false,
  children,
  ...rest
}) => {
  const [open, setOpen] = React.useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const delay = typeof longPress === "number" ? longPress : 500;

  // Handlers for long press
  const startLongPress = useCallback(() => {
    if (!longPress) return;
    timerRef.current = setTimeout(() => setOpen(true), delay);
  }, [longPress, delay]);

  const cancelLongPress = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (open) setOpen(false);
  }, [open]);

  // Compose event handlers
  if (!React.isValidElement(children)) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("Tooltip expects a single React element as its child.");
    }
    return null;
  }
  const child = children as React.ReactElement;
  const childProps: typeof child.props = {
    ...child.props,
    onTouchStart: (e: React.TouchEvent) => {
      child.props.onTouchStart?.(e);
      startLongPress();
    },
    onTouchEnd: (e: React.TouchEvent) => {
      child.props.onTouchEnd?.(e);
      // Do nothing: keep tooltip open after long press
    },
    onTouchMove: (e: React.TouchEvent) => {
      child.props.onTouchMove?.(e);
      // Close tooltip on pointer move away (cancel long press)
      cancelLongPress();
    },
    onMouseDown: (e: React.MouseEvent) => {
      child.props.onMouseDown?.(e);
      startLongPress();
    },
    onMouseUp: (e: React.MouseEvent) => {
      child.props.onMouseUp?.(e);
      // Do nothing: keep tooltip open after long press
    },
    onMouseLeave: (e: React.MouseEvent) => {
      child.props.onMouseLeave?.(e);
      cancelLongPress();
    },
  };

  return (
    <HeroTooltip open={longPress ? open : undefined} {...rest}>
      {React.cloneElement(child, childProps)}
    </HeroTooltip>
  );
};

export default Tooltip;
