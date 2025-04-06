import { HighlightsContext } from "@app/providers/Highlights";
import {
  ShortcutType,
  useKeyboardShortcuts,
} from "@app/providers/KeyboardShortcuts";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";

export const HighlightNavigationShortcuts = (): null => {
  const {
    highlights,
    selectHighlight,
    selectedHighlightIndex,
    selectedHighlight,
  } = useContext(HighlightsContext);

  const navigate = useNavigate();

  const openItem = (): boolean => {
    if (selectedHighlight) {
      navigate(`/item/${selectedHighlight.item.slug}`);
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

  useKeyboardShortcuts({
    key: "ArrowDown",
    name: "Next highlight",
    category: ShortcutType.NAVIGATION,
    handler: navigateDown,
    priority: 100,
  });

  useKeyboardShortcuts({
    key: "j",
    name: "Next highlight",
    category: ShortcutType.NAVIGATION,
    handler: navigateDown,
    priority: 100,
  });

  useKeyboardShortcuts({
    key: "ArrowUp",
    name: "Previous highlight",
    category: ShortcutType.NAVIGATION,
    handler: navigateUp,
    priority: 100,
  });

  useKeyboardShortcuts({
    key: "k",
    name: "Previous highlight",
    category: ShortcutType.NAVIGATION,
    handler: navigateUp,
    priority: 100,
  });

  useKeyboardShortcuts({
    key: "Escape",
    name: "Clear selection",
    category: ShortcutType.NAVIGATION,
    handler: (): boolean => {
      selectHighlight(null);
      return true;
    },
    priority: 100,
  });

  useKeyboardShortcuts({
    key: "o",
    name: "Open item",
    category: ShortcutType.NAVIGATION,
    handler: openItem,
    priority: 100,
  });

  return null;
};
