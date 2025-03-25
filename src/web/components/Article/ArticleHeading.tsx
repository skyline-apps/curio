import { useAppPage } from "@web/providers/AppPageProvider";
import React from "react";
import { createPortal } from "react-dom";

interface ArticleHeadingProps extends React.PropsWithChildren {
  anchor: string;
}

const ArticleHeading: React.FC<ArticleHeadingProps> = ({
  children,
  anchor,
}: ArticleHeadingProps): React.ReactElement => {
  const { articleFixedInfoRef } = useAppPage();

  if (!articleFixedInfoRef.current) {
    return <></>;
  }

  return createPortal(
    <a
      className="truncate"
      role="button"
      style={{ cursor: "pointer" }}
      href={`#${anchor}`}
    >
      {children}
    </a>,
    articleFixedInfoRef.current,
  );
};

export default ArticleHeading;
