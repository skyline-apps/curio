import { Snippet, type SnippetProps } from "@heroui/react";

export type CurioSnippetProps = SnippetProps;

const CurioSnippet = ({
  children,
  symbol,
  ...props
}: CurioSnippetProps): React.ReactElement => {
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
