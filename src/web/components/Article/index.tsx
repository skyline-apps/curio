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

const Article: React.FC<ArticleProps> = React.memo(
  ({ content, className }: ArticleProps) => {
    const { loadedItem, isEditable } = useContext(CurrentItemContext);

    // Extract only the highlights and item ID to prevent re-renders from metadata changes
    const itemId = loadedItem?.item.id;
    const itemHighlights =
      loadedItem?.item && "highlights" in loadedItem.item
        ? loadedItem.item.highlights
        : null;

    const highlights = useMemo(() => itemHighlights || [], [itemHighlights]);

    // Extract editable status directly to prevent re-renders from metadata changes
    const isEditableValue = useMemo(
      () => isEditable(loadedItem?.item),
      [isEditable, itemId], // eslint-disable-line react-hooks/exhaustive-deps
    );

    // Memoize the viewer to prevent re-renders from scroll updates
    const viewer = useMemo(
      () => (
        <MarkdownViewer
          highlights={highlights}
          className={cn("py-4", className)}
          isEditable={isEditableValue}
        >
          {content}
        </MarkdownViewer>
      ),
      [highlights, className, isEditableValue, content],
    );

    return (
      <>
        <ItemActionShortcuts />
        <ScrollProgressTracker />
        {viewer}
      </>
    );
  },
);

Article.displayName = "Article";
export default Article;
