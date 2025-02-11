import React from "react";
import ReactMarkdown from "react-markdown";

import {
  CreateOrUpdateHighlightResponse,
  type Highlight,
  type NewHighlight,
} from "@/app/api/v1/items/highlights/validation";
import { ReadItemResponse } from "@/app/api/v1/items/read/validation";
import { useAppPage } from "@/providers/AppPageProvider";
import { cn } from "@/utils/cn";

import { useScrollProgress } from "./useScrollProgress";

interface MarkdownViewerProps {
  readingProgress: number;
  onProgressChange?: (progress: number) => Promise<ReadItemResponse>;
  highlights: Highlight[];
  onHighlight?: (
    highlight: NewHighlight,
  ) => Promise<CreateOrUpdateHighlightResponse>;
  className?: string;
  children?: string;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  readingProgress,
  onProgressChange,
  highlights,
  onHighlight,
  className,
  children,
}) => {
  const { containerRef } = useAppPage();
  useScrollProgress({
    initialProgress: readingProgress,
    containerRef,
    onProgressChange,
  });

  return (
    <div
      className={cn(
        "prose prose-slate max-w-none overflow-y-auto h-full [&_*]:!text-default-foreground hover:prose-a:!text-primary dark:prose-invert",
        className,
      )}
    >
      <ReactMarkdown>{children || ""}</ReactMarkdown>
    </div>
  );
};

export default MarkdownViewer;
