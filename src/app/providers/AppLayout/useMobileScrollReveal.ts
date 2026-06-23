import { useCallback, useEffect, useRef, useState } from "react";

const FADE_DELAY_MS = 3000;

/**
 * On mobile, returns a `visible` boolean that is `true` when the user is idle
 * and `false` while scrolling. After scrolling stops, waits FADE_DELAY_MS then
 * fades back in.
 *
 * Always returns `true` on non-touch / desktop viewports.
 */
export const useMobileScrollReveal = (): boolean => {
  const [visible, setVisible] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScroll = useCallback(() => {
    setVisible(false);
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setVisible(true);
    }, FADE_DELAY_MS);
  }, []);

  useEffect(() => {
    // Use capture so we catch scroll events from any scrollable child element
    window.addEventListener("scroll", handleScroll, {
      capture: true,
      passive: true,
    });
    return () => {
      window.removeEventListener("scroll", handleScroll, { capture: true });
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleScroll]);

  return visible;
};
