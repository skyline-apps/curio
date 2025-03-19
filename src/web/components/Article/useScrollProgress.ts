import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

import { ReadItemResponse } from "@/app/api/v1/items/read/validation";

interface UseScrollProgressProps {
  initialProgress: number;
  containerRef: React.RefObject<HTMLElement>;
  onProgressChange?: (progress: number) => Promise<ReadItemResponse>;
}

export function useScrollProgress({
  initialProgress,
  containerRef,
  onProgressChange,
}: UseScrollProgressProps): { progress: number } {
  const [progress, setProgress] = useState<number>(initialProgress);

  const debouncedScrollHandler = useDebouncedCallback(
    (element: HTMLElement) => {
      const totalHeight = element.scrollHeight - element.clientHeight;
      const currentProgress = Math.round(
        (element.scrollTop / totalHeight) * 100,
      );
      if (currentProgress !== progress) {
        setProgress(currentProgress);
        onProgressChange?.(currentProgress);
      }
    },
    300,
  );

  useEffect(() => {
    const handleScroll = (): void => {
      if (!containerRef.current) return;
      debouncedScrollHandler(containerRef.current);
    };
    const element = containerRef.current;
    element?.addEventListener("scroll", handleScroll);
    return () => {
      element?.removeEventListener("scroll", handleScroll);
      debouncedScrollHandler.cancel();
    };
  }, [onProgressChange, debouncedScrollHandler, containerRef]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (initialProgress === 0) {
      onProgressChange?.(0);
      return;
    }
    const element = containerRef.current;
    const totalHeight = element.scrollHeight - element.clientHeight;
    element.scrollTop = (initialProgress / 100) * totalHeight;
    // Only manually scroll on component initialization
  }, [containerRef.current]); // eslint-disable-line react-hooks/exhaustive-deps

  return { progress };
}
