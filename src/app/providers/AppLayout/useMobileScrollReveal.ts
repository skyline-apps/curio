import { useCallback, useEffect, useRef, useState } from "react";

const FADE_DELAY_MS = 1000;

/**
 * On mobile, returns a `visible` boolean that becomes true briefly when the
 * user scrolls, then fades away after FADE_DELAY_MS of inactivity.
 *
 * Always returns `true` on non-touch / desktop viewports.
 */
export const useMobileScrollReveal = (): boolean => {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScroll = useCallback(() => {
    setVisible(true);
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setVisible(false);
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
