"use client";
import { useItemUpdate } from "components/Items/ItemActions/actions";
import { useRouter } from "next/navigation";
import { useContext } from "react";

import { ItemState } from "@/db/schema";
import { CurrentItemContext } from "@/providers/CurrentItemProvider";
import { ItemsContext } from "@/providers/ItemsProvider";
import {
  ShortcutType,
  useKeyboardShortcut,
} from "@/providers/KeyboardShortcutProvider";

export const ItemActionShortcuts = (): null => {
  const { items } = useContext(ItemsContext);
  const { loadedItem } = useContext(CurrentItemContext);

  const { updateItemsState, updateItemsFavorite } = useItemUpdate();

  const router = useRouter();

  const goHome = (): boolean => {
    router.push("/home");
    return true;
  };

  const goToNextItem = (): boolean => {
    if (!items.length || !loadedItem?.item) {
      return false;
    }
    const currentIndex = items.findIndex(
      (item) => item.slug === loadedItem.item.slug,
    );
    if (currentIndex === -1) {
      return false;
    }
    const nextIndex = (currentIndex + 1) % items.length;
    const nextItem = items[nextIndex];
    router.push(`/items/${nextItem.slug}`);
    return true;
  };

  const goToPreviousItem = (): boolean => {
    if (!items.length || !loadedItem?.item) {
      return false;
    }
    const currentIndex = items.findIndex(
      (item) => item.slug === loadedItem.item.slug,
    );
    if (currentIndex === -1) {
      return false;
    }
    const nextIndex = (currentIndex - 1) % items.length;
    const nextItem = items[nextIndex];
    router.push(`/items/${nextItem.slug}`);
    return true;
  };

  const favoriteCurrentItem = async (): Promise<boolean> => {
    if (!loadedItem?.item) {
      return false;
    }
    const currentFavoriteState = loadedItem.item.metadata.isFavorite;
    await updateItemsFavorite([loadedItem.item.slug], !currentFavoriteState);
    return true;
  };

  const archiveCurrentItem = async (): Promise<boolean> => {
    if (!loadedItem?.item) {
      return false;
    }
    await updateItemsState([loadedItem.item.slug], ItemState.ARCHIVED);
    return true;
  };

  const deleteCurrentItem = async (): Promise<boolean> => {
    if (!loadedItem?.item) {
      return false;
    }
    await updateItemsState([loadedItem.item.slug], ItemState.DELETED);
    return true;
  };

  useKeyboardShortcut({
    key: "Escape",
    name: "Go home",
    category: ShortcutType.NAVIGATION,
    handler: goHome,
    priority: 100,
  });

  useKeyboardShortcut({
    key: "J",
    name: "Open next item",
    category: ShortcutType.NAVIGATION,
    handler: goToNextItem,
    priority: 100,
    conditions: {
      shiftKey: true,
    },
  });

  useKeyboardShortcut({
    key: "K",
    name: "Open previous item",
    category: ShortcutType.NAVIGATION,
    handler: goToPreviousItem,
    priority: 100,
    conditions: {
      shiftKey: true,
    },
  });

  useKeyboardShortcut({
    key: "S",
    name: "Toggle favorite",
    category: ShortcutType.ACTIONS,
    handler: favoriteCurrentItem,
    priority: 100,
    conditions: {
      shiftKey: true,
    },
  });

  useKeyboardShortcut({
    key: "e",
    name: "Archive item",
    category: ShortcutType.ACTIONS,
    handler: archiveCurrentItem,
    priority: 100,
  });

  useKeyboardShortcut({
    key: "#",
    name: "Delete item",
    category: ShortcutType.ACTIONS,
    handler: deleteCurrentItem,
    priority: 100,
    conditions: {
      shiftKey: true,
    },
  });

  return null;
};
