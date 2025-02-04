"use client";
import { useContext } from "react";

import { CurrentItemContext } from "@/providers/CurrentItemProvider";
import { ItemsContext } from "@/providers/ItemsProvider";
import { useKeyboardShortcut } from "@/providers/KeyboardShortcutProvider";

export const ItemNavigation = (): null => {
  const { items } = useContext(ItemsContext);
  const { selectItems, lastSelectionIndex } = useContext(CurrentItemContext);

  const navigateDown = (): boolean => {
    if (lastSelectionIndex === null) {
      selectItems([items[0].slug], 0);
    } else if (lastSelectionIndex < items.length - 1) {
      const nextItem = items[lastSelectionIndex + 1];
      selectItems([nextItem.slug], lastSelectionIndex + 1);
    }
    return true;
  };

  const navigateUp = (): boolean => {
    if (lastSelectionIndex === null) {
      selectItems([items[0].slug], 0);
    } else if (lastSelectionIndex > 0) {
      const prevItem = items[lastSelectionIndex - 1];
      selectItems([prevItem.slug], lastSelectionIndex - 1);
    }
    return true;
  };

  useKeyboardShortcut({
    key: "ArrowDown",
    name: "Select next item",
    handler: navigateDown,
    priority: 100,
  });

  useKeyboardShortcut({
    key: "j",
    name: "Select next item",
    handler: navigateDown,
    priority: 100,
  });

  useKeyboardShortcut({
    key: "ArrowUp",
    name: "Select previous item",
    handler: navigateUp,
    priority: 100,
  });

  useKeyboardShortcut({
    key: "k",
    name: "Select previous item",
    handler: navigateUp,
    priority: 100,
  });

  return null;
};
