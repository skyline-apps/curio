"use client";

import { Snippet, type SnippetProps } from "@nextui-org/react";
import React from "react";

export interface CurioSnippetProps extends SnippetProps {}

const CurioSnippet = ({
  children,
  symbol,
  ...props
}: CurioSnippetProps): JSX.Element => {
  return (
    <Snippet
      symbol={symbol || ""}
      {...props}
      classNames={{ pre: "overflow-auto" }}
    >
      {children}
    </Snippet>
  );
};

export default CurioSnippet;
