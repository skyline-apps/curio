import { cn } from "@app/utils/cn";
import React, { useMemo } from "react";
import ReactMarkdown, { Options } from "react-markdown";

import MarkdownErrorBoundary from "./error-boundary";
import HeadingAnchorElement from "./HeadingAnchorElement";
import { childrenToText, getHeadingAnchor, HEADING_TAGS } from "./utils";

interface MarkdownProps extends Options {
  className?: string;
  headingPortalRef?: React.RefObject<HTMLElement | null>;
}

const Markdown: React.FC<MarkdownProps> = ({
  children,
  className,
  headingPortalRef,
  ...otherProps
}: MarkdownProps) => {
  const mergedComponents = useMemo(() => {
    if (children === undefined || children === null)
      return otherProps.components || {};

    const headingComponents = headingPortalRef
      ? Object.fromEntries(
          HEADING_TAGS.map((tag) => [
            tag,
            (props: { children: React.ReactNode }) => (
              <HeadingAnchorElement
                tag={tag}
                anchor={getHeadingAnchor(childrenToText(props.children))}
                portalRef={headingPortalRef}
                {...props}
              >
                {props.children}
              </HeadingAnchorElement>
            ),
          ]),
        )
      : {};

    return {
      ...headingComponents,
      a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
        <a {...props} target="_blank" rel="noopener noreferrer" />
      ),
      ...otherProps.components,
    };
  }, [headingPortalRef, otherProps.components, children]);

  if (children === undefined || children === null) return null;

  return (
    <ReactMarkdown
      className={cn(
        "prose max-w-none overflow-y-hidden [&_*]:text-default-foreground hover:prose-a:!text-primary dark:prose-invert",
        className,
      )}
      components={mergedComponents}
      {...otherProps}
    >
      {children.toString()}
    </ReactMarkdown>
  );
};

export type { Components } from "react-markdown";
const MarkdownWithErrorBoundary = (
  props: MarkdownProps,
): React.ReactElement => (
  <MarkdownErrorBoundary>
    <Markdown {...props} />
  </MarkdownErrorBoundary>
);

export default MarkdownWithErrorBoundary;
