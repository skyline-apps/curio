import React from "react";
import { createPortal } from "react-dom";

import { useAppPage } from "@/providers/AppPageProvider";

interface ArticleHeadingProps extends React.PropsWithChildren {
  heading: React.RefObject<HTMLElement>;
}

const ArticleHeading: React.FC<ArticleHeadingProps> = ({
  children,
  heading,
}: ArticleHeadingProps): React.ReactElement => {
  const { articleFixedInfoRef } = useAppPage();

  if (!articleFixedInfoRef.current) {
    return <></>;
  }

  const handleClick = (): void => {
    if (heading.current) {
      heading.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return createPortal(
    <a
      className="truncate"
      onClick={handleClick}
      role="button"
      style={{ cursor: "pointer" }}
    >
      {children}
    </a>,
    articleFixedInfoRef.current,
  );
};

export default ArticleHeading;
