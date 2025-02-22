import React from "react";
import ReactMarkdown, { Options } from "react-markdown";

import { cn } from "@/utils/cn";

interface MarkdownProps extends Options {
  className?: string;
}

const Markdown: React.FC<MarkdownProps> = ({
  children,
  className,
  components,
}: MarkdownProps) => {
  if (children === undefined || children === null) return null;
  return (
    <ReactMarkdown
      className={cn(
        "prose prose-slate max-w-none overflow-y-auto h-full [&_*]:text-default-foreground hover:prose-a:!text-primary dark:prose-invert",
        className,
      )}
      components={components}
    >
      {children.toString()}
    </ReactMarkdown>
  );
};

export type { Components } from "react-markdown";
export default Markdown;
