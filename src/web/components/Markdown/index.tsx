import React from "react";
import ReactMarkdown, { Options } from "react-markdown";

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
    <ReactMarkdown className={className} components={components}>
      {children.toString()}
    </ReactMarkdown>
  );
};

export default Markdown;
