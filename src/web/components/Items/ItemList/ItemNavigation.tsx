"use client";
import { useContext } from "react";

import { CurrentItemContext } from "@/providers/CurrentItemProvider";
import { ItemsContext } from "@/providers/ItemsProvider";
import {
  ShortcutType,
  useKeyboardShortcut,
} from "@/providers/KeyboardShortcutProvider";

export const ItemNavigation = (): null => {
  const { items } = useContext(ItemsContext);
  const {
    selectItems,
    lastSelectionIndex,
    setLastSelectionIndex,
    clearSelectedItems,
  } = useContext(CurrentItemContext);

  const navigateDown = (): boolean => {
    if (lastSelectionIndex === null) {
      setLastSelectionIndex(0);
    } else if (lastSelectionIndex < items.length - 1) {
      setLastSelectionIndex(lastSelectionIndex + 1);
    }
    return true;
  };

  const navigateUp = (): boolean => {
    if (lastSelectionIndex === null) {
      setLastSelectionIndex(0);
    } else if (lastSelectionIndex > 0) {
      setLastSelectionIndex(lastSelectionIndex - 1);
    }
    return true;
  };

  const selectCurrentItem = (): boolean => {
    if (lastSelectionIndex !== null) {
      selectItems([items[lastSelectionIndex].slug], lastSelectionIndex, false);
    }
    return true;
  };

  useKeyboardShortcut({
    key: "ArrowDown",
    name: "Next item",
    category: ShortcutType.ITEMS,
    handler: navigateDown,
    priority: 100,
  });

  useKeyboardShortcut({
    key: "j",
    name: "Next item",
    category: ShortcutType.ITEMS,
    handler: navigateDown,
    priority: 100,
  });

  useKeyboardShortcut({
    key: "ArrowUp",
    name: "Previous item",
    category: ShortcutType.ITEMS,
    handler: navigateUp,
    priority: 100,
  });

  useKeyboardShortcut({
    key: "k",
    name: "Previous item",
    category: ShortcutType.ITEMS,
    handler: navigateUp,
    priority: 100,
  });

  useKeyboardShortcut({
    key: "x",
    name: "Select item",
    category: ShortcutType.ITEMS,
    handler: selectCurrentItem,
    priority: 100,
  });

  useKeyboardShortcut({
    key: "Enter",
    name: "Select item",
    category: ShortcutType.ITEMS,
    handler: selectCurrentItem,
    priority: 100,
  });

  useKeyboardShortcut({
    key: "Escape",
    name: "Clear selection",
    category: ShortcutType.ITEMS,
    handler: (): boolean => {
      clearSelectedItems();
      return true;
    },
    priority: 100,
  });

  return null;
};
