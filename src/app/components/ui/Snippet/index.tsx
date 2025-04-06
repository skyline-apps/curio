import { Snippet, type SnippetProps } from "@heroui/react";

export interface CurioSnippetProps extends SnippetProps { }

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
