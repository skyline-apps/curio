"use client";
import { useRouter } from "next/navigation";
import { useContext } from "react";

import { HighlightsContext } from "@/providers/HighlightsProvider";
import {
  ShortcutType,
  useKeyboardShortcut,
} from "@/providers/KeyboardShortcutProvider";

export const HighlightNavigationShortcuts = (): null => {
  const {
    highlights,
    selectHighlight,
    selectedHighlightIndex,
    selectedHighlight,
  } = useContext(HighlightsContext);

  const router = useRouter();

  const openItem = (): boolean => {
    if (selectedHighlight) {
      router.push(`/item/${selectedHighlight.item.slug}`);
      return true;
    }
    return false;
  };

  const navigateDown = (): boolean => {
    if (selectedHighlight === null || selectedHighlightIndex === null) {
      selectHighlight(highlights[0].id);
      return true;
    }
    const newIndex = selectedHighlightIndex + 1;
    if (newIndex < highlights.length) {
      selectHighlight(highlights[newIndex].id);
    }
    return true;
  };

  const navigateUp = (): boolean => {
    if (selectedHighlight === null || selectedHighlightIndex === null) {
      selectHighlight(highlights[0].id);
      return true;
    }
    const newIndex = selectedHighlightIndex - 1;
    if (newIndex >= 0) {
      selectHighlight(highlights[newIndex].id);
    }
    return true;
  };

  useKeyboardShortcut({
    key: "ArrowDown",
    name: "Next highlight",
    category: ShortcutType.NAVIGATION,
    handler: navigateDown,
    priority: 100,
  });

  useKeyboardShortcut({
    key: "j",
    name: "Next highlight",
    category: ShortcutType.NAVIGATION,
    handler: navigateDown,
    priority: 100,
  });

  useKeyboardShortcut({
    key: "ArrowUp",
    name: "Previous highlight",
    category: ShortcutType.NAVIGATION,
    handler: navigateUp,
    priority: 100,
  });

  useKeyboardShortcut({
    key: "k",
    name: "Previous highlight",
    category: ShortcutType.NAVIGATION,
    handler: navigateUp,
    priority: 100,
  });

  useKeyboardShortcut({
    key: "Escape",
    name: "Clear selection",
    category: ShortcutType.NAVIGATION,
    handler: (): boolean => {
      selectHighlight(null);
      return true;
    },
    priority: 100,
  });

  useKeyboardShortcut({
    key: "o",
    name: "Open item",
    category: ShortcutType.NAVIGATION,
    handler: openItem,
    priority: 100,
  });

  return null;
};
