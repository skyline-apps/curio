import Markdown, { Options } from "react-markdown";

import { cn } from "@/utils/cn";

interface MarkdownViewerProps extends Options {
  className?: string;
}

const MarkdownViewer = ({
  className,
  ...options
}: MarkdownViewerProps): JSX.Element => {
  return (
    <div
      className={cn(
        "prose prose-slate max-w-none [&_*]:!text-default-foreground hover:prose-a:!text-primary dark:prose-invert",
        className,
      )}
    >
      <Markdown {...options} />
    </div>
  );
};

export default MarkdownViewer;
