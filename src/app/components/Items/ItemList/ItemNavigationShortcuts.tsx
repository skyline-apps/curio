import { useItemUpdate } from "@app/components/Items/ItemActions/actions";
import { CurrentItemContext } from "@app/providers/CurrentItem";
import { ItemsContext } from "@app/providers/Items";
import {
  ShortcutType,
  useKeyboardShortcuts,
} from "@app/providers/KeyboardShortcuts";
import { ItemState } from "@web/db/schema";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";

export const ItemNavigationShortcuts = (): null => {
  const { items } = useContext(ItemsContext);
  const {
    selectItems,
    inSelectionMode,
    lastSelectionIndex,
    setLastSelectionIndex,
    clearSelectedItems,
    selectedItems,
  } = useContext(CurrentItemContext);

  const { updateItemsState, updateItemsFavorite } = useItemUpdate();

  const navigate = useNavigate();

  const openItem = (): boolean => {
    if (selectedItems.size === 1) {
      navigate(`/item/${selectedItems.values().next().value}`);
      clearSelectedItems();
      return true;
    }
    return false;
  };

  const navigateDown = (): boolean => {
    if (!items.length) return false;
    if (lastSelectionIndex === items.length - 1) return false;
    const newIndex = lastSelectionIndex === null ? 0 : lastSelectionIndex + 1;
    if (!inSelectionMode && selectedItems.size <= 1) {
      selectItems([items[newIndex].slug], newIndex);
    }
    setLastSelectionIndex(newIndex);
    return true;
  };

  const navigateUp = (): boolean => {
    if (!items.length) return false;
    if (lastSelectionIndex === 0) return false;
    const newIndex = lastSelectionIndex === null ? 0 : lastSelectionIndex - 1;
    if (!inSelectionMode && selectedItems.size <= 1) {
      selectItems([items[newIndex].slug], newIndex);
    }
    setLastSelectionIndex(newIndex);
    return true;
  };

  const selectCurrentItem = (): boolean => {
    if (lastSelectionIndex !== null) {
      selectItems(
        [items[lastSelectionIndex].slug],
        lastSelectionIndex,
        false,
        false,
        true,
      );
    }
    return true;
  };

  const favoriteCurrentItem = async (): Promise<boolean> => {
    const itemsToUpdate =
      selectedItems.size > 0
        ? items.filter((item) => selectedItems.has(item.slug))
        : lastSelectionIndex !== null
          ? [items[lastSelectionIndex]]
          : [];

    if (itemsToUpdate.length > 0) {
      const currentFavoriteState = itemsToUpdate[0].metadata.isFavorite;
      await updateItemsFavorite(
        itemsToUpdate.map((item) => item.slug),
        !currentFavoriteState,
      );
    }
    return true;
  };

  const archiveCurrentItem = async (): Promise<boolean> => {
    const itemsToUpdate =
      selectedItems.size > 0
        ? items.filter(
            (item) =>
              selectedItems.has(item.slug) &&
              item.metadata.state !== ItemState.ARCHIVED,
          )
        : lastSelectionIndex !== null
          ? [items[lastSelectionIndex]]
          : [];

    if (itemsToUpdate.length > 0) {
      await updateItemsState(
        itemsToUpdate.map((item) => item.slug),
        ItemState.ARCHIVED,
      );
    }
    return true;
  };

  const deleteCurrentItem = async (): Promise<boolean> => {
    const itemsToUpdate =
      selectedItems.size > 0
        ? items.filter(
            (item) =>
              selectedItems.has(item.slug) &&
              item.metadata.state !== ItemState.DELETED,
          )
        : lastSelectionIndex !== null
          ? [items[lastSelectionIndex]]
          : [];

    if (itemsToUpdate.length > 0) {
      await updateItemsState(
        itemsToUpdate.map((item) => item.slug),
        ItemState.DELETED,
      );
    }
    return true;
  };

  useKeyboardShortcuts({
    key: "ArrowDown",
    name: "Next item",
    category: ShortcutType.NAVIGATION,
    handler: navigateDown,
    priority: 100,
  });

  useKeyboardShortcuts({
    key: "j",
    name: "Next item",
    category: ShortcutType.NAVIGATION,
    handler: navigateDown,
    priority: 100,
  });

  useKeyboardShortcuts({
    key: "ArrowUp",
    name: "Previous item",
    category: ShortcutType.NAVIGATION,
    handler: navigateUp,
    priority: 100,
  });

  useKeyboardShortcuts({
    key: "k",
    name: "Previous item",
    category: ShortcutType.NAVIGATION,
    handler: navigateUp,
    priority: 100,
  });

  useKeyboardShortcuts({
    key: "x",
    name: "Select item",
    category: ShortcutType.NAVIGATION,
    handler: selectCurrentItem,
    priority: 100,
  });

  useKeyboardShortcuts({
    key: "Enter",
    name: "Select item",
    category: ShortcutType.NAVIGATION,
    handler: selectCurrentItem,
    priority: 100,
  });

  useKeyboardShortcuts({
    key: "Escape",
    name: "Clear selection",
    category: ShortcutType.NAVIGATION,
    handler: (): boolean => {
      clearSelectedItems();
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

  useKeyboardShortcuts({
    key: "S",
    name: "Toggle favorite",
    category: ShortcutType.ACTIONS,
    handler: favoriteCurrentItem,
    priority: 100,
    conditions: {
      shiftKey: true,
    },
  });

  useKeyboardShortcuts({
    key: "e",
    name: "Archive item",
    category: ShortcutType.ACTIONS,
    handler: archiveCurrentItem,
    priority: 100,
  });

  useKeyboardShortcuts({
    key: "d",
    name: "Delete item",
    category: ShortcutType.ACTIONS,
    handler: deleteCurrentItem,
    priority: 100,
  });

  return null;
};
