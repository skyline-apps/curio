import { createLogger } from "@web/utils/logger";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

const log = createLogger("useScrollProgress");

interface UseScrollProgressProps {
  initialProgress: number;
  containerRef: React.RefObject<HTMLElement>;
  onProgressChange?: (progress: number) => Promise<void>;
}

export function useScrollProgress({
  initialProgress,
  containerRef,
  onProgressChange,
}: UseScrollProgressProps): { progress: number } {
  const [progress, setProgress] = useState<number>(initialProgress);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  const debouncedScrollHandler = useDebouncedCallback(
    (element: HTMLElement) => {
      const totalHeight = element.scrollHeight - element.clientHeight;
      const currentProgress = Math.round(
        (element.scrollTop / totalHeight) * 100,
      );
      if (currentProgress !== progressRef.current) {
        setProgress(currentProgress);
        onProgressChange?.(currentProgress);
      }
    },
    300,
    // Disable leading/trailing callbacks to minimize updates
    { leading: false, trailing: true, maxWait: 1000 },
  );

  // Memoize the scroll handler to prevent recreation
  const handleScroll = useCallback((): void => {
    if (!containerRef.current) return;
    debouncedScrollHandler(containerRef.current);
  }, [debouncedScrollHandler, containerRef]);

  useEffect(() => {
    const element = containerRef.current;
    element?.addEventListener("scroll", handleScroll);
    return () => {
      element?.removeEventListener("scroll", handleScroll);
      debouncedScrollHandler.cancel();
    };
  }, [handleScroll, debouncedScrollHandler, containerRef]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Handle anchor scrolling first
    if (typeof window !== "undefined" && window.location.hash) {
      const id = window.location.hash.slice(1);
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView();
        return;
      }
    }

    // If no anchor or anchor element not found, handle initial scroll position
    if (initialProgress === 0) {
      onProgressChange?.(0).catch((error) => {
        log.error("Failed to update reading progress:", error);
      });
      return;
    }
    const element = containerRef.current;
    const totalHeight = element.scrollHeight - element.clientHeight;
    element.scrollTop = (initialProgress / 100) * totalHeight;
    // Only manually scroll on component initialization
  }, [containerRef.current]); // eslint-disable-line react-hooks/exhaustive-deps

  return { progress };
}
