import React, { useEffect, useState } from "react";
import Markdown, { Options } from "react-markdown";
import { useDebouncedCallback } from "use-debounce";

import { ReadItemResponse } from "@/app/api/v1/items/read/validation";
import { useAppPage } from "@/providers/AppPageProvider";
import { cn } from "@/utils/cn";

interface MarkdownViewerProps extends Options {
  className?: string;
  readingProgress: number;
  onProgressChange?: (progress: number) => Promise<ReadItemResponse>;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  className,
  readingProgress = 0,
  onProgressChange,
  ...options
}: MarkdownViewerProps): JSX.Element => {
  const [progress, setProgress] = useState<number>(readingProgress); // Used to track progress on the client side
  const { containerRef } = useAppPage();

  const debouncedScrollHandler = useDebouncedCallback((element) => {
    const totalHeight = element.scrollHeight - element.clientHeight;
    const currentProgress = Math.round((element.scrollTop / totalHeight) * 100);

    if (currentProgress !== progress) {
      setProgress(currentProgress);
      onProgressChange?.(currentProgress);
    }
  }, 300);

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
    // TODO: Debug why this data is stale
    if (!containerRef.current || !readingProgress) return;

    const element = containerRef.current;
    const totalHeight = element.scrollHeight - element.clientHeight;
    element.scrollTop = (readingProgress / 100) * totalHeight;
    // Only manually scroll on component initialization
  }, [containerRef.current]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className={cn(
        "prose prose-slate max-w-none overflow-y-auto h-full [&_*]:!text-default-foreground hover:prose-a:!text-primary dark:prose-invert",
        className,
      )}
    >
      <Markdown {...options} />
    </div>
  );
};

export default MarkdownViewer;
