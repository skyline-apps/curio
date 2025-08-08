import slugify from "limax";
import React from "react";

export const HEADING_TAGS = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;
export type HeadingTag = (typeof HEADING_TAGS)[number];

export function getHeadingAnchor(text: string): string {
  return slugify(text);
}

export function childrenToText(children: React.ReactNode): string {
  if (Array.isArray(children)) {
    return children.reduce((acc, child) => acc + childrenToText(child), "");
  } else if (
    children !== null &&
    typeof children === "object" &&
    "props" in children &&
    (children as { props?: { children?: React.ReactNode } }).props?.children
  ) {
    return childrenToText(
      (children as { props: { children: React.ReactNode } }).props.children,
    );
  } else if (typeof children === "string") {
    return children;
  }
  return "";
}
