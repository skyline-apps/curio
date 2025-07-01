import { useDrag } from "react-use-gesture";
import type { ReactEventHandlers } from "react-use-gesture/dist/types";

export const SWIPE_THRESHOLD_DISTANCE = 50; // Min distance in pixels for a swipe
export const SWIPE_THRESHOLD_VELOCITY = 0.3; // Min velocity for a swipe

interface UseSidebarSwipeProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  side: "left" | "right";
}

/**
 * Custom hook to handle swipe gestures for opening/closing a sidebar.
 *
 * @param isOpen - Current state of the sidebar.
 * @param onOpen - Callback to open the sidebar.
 * @param onClose - Callback to close the sidebar.
 * @param side - Which side the sidebar is on ('left' or 'right').
 * @returns Gesture binder props to spread onto the target element.
 */
export const useSidebarSwipe = ({
  isOpen,
  onOpen,
  onClose,
  side,
}: UseSidebarSwipeProps): (() => ReactEventHandlers) => {
  const bind = useDrag(
    ({ axis, last, movement: [mx], velocity, direction: [dx] }) => {
      // Ignore vertical scrolls
      if (axis === "y") return;

      if (last) {
        const isSwipeRight = dx > 0;
        const isSwipeLeft = dx < 0;
        const meetsThreshold =
          Math.abs(mx) > SWIPE_THRESHOLD_DISTANCE ||
          velocity > SWIPE_THRESHOLD_VELOCITY;

        if (side === "left") {
          if (!isOpen && isSwipeRight && meetsThreshold) {
            onOpen();
          } else if (isOpen && isSwipeLeft && meetsThreshold) {
            onClose();
          }
        } else if (side === "right") {
          if (!isOpen && isSwipeLeft && meetsThreshold) {
            onOpen();
          } else if (isOpen && isSwipeRight && meetsThreshold) {
            onClose();
          }
        }
      }
    },
    {
      axis: "x", // Only track horizontal movement
      filterTaps: false, // Needed to preserve proper press behavior
      preventDefault: true, // Prevents default browser drag behavior
    },
  );

  return bind;
};
