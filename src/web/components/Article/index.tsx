import React, { useContext, useMemo } from "react";

import { CurrentItemContext } from "@/providers/CurrentItemProvider";
import { cn } from "@/utils/cn";

import { ItemActionShortcuts } from "./ItemActionShortcuts";
import MarkdownViewer from "./MarkdownViewer";
import ScrollProgressTracker from "./ScrollProgressTracker";

interface ArticleProps {
  content: string;
  className?: string;
}

const Article: React.FC<ArticleProps> = ({
  content,
  className,
}: ArticleProps) => {
  const { loadedItem, isEditable } = useContext(CurrentItemContext);

  const highlights = useMemo(
    () =>
      loadedItem?.item && "highlights" in loadedItem?.item
        ? loadedItem?.item.highlights || []
        : [],
    [loadedItem?.item],
  );

  return (
    <>
      <ItemActionShortcuts />
      {/* Progress tracker is separate from the content renderer */}
      <ScrollProgressTracker />
      <MarkdownViewer
        highlights={highlights}
        className={cn("py-4", className)}
        isEditable={isEditable(loadedItem?.item)}
      >
        {content}
      </MarkdownViewer>
    </>
  );
};

export default Article;
