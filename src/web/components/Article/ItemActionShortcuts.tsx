"use client";
import { useItemUpdate } from "@web/components/Items/ItemActions/actions";
import { ItemState } from "@web/db/schema";
import { useAppPage } from "@web/providers/AppPageProvider";
import { CurrentItemContext } from "@web/providers/CurrentItemProvider";
import { ItemsContext } from "@web/providers/ItemsProvider";
import {
  ShortcutType,
  useKeyboardShortcut,
} from "@web/providers/KeyboardShortcutProvider";
import { useRouter } from "next/navigation";
import { useContext } from "react";

export const ItemActionShortcuts = (): null => {
  const { items } = useContext(ItemsContext);
  const { loadedItem, isEditable } = useContext(CurrentItemContext);

  const { updateItemsState, updateItemsFavorite } = useItemUpdate();

  const router = useRouter();
  const { containerRef } = useAppPage();

  const getNextItemSlug = (increment = 1): string | null => {
    if (!items.length || !loadedItem?.item) {
      return null;
    }
    const currentIndex = items.findIndex(
      (item) => item.slug === loadedItem.item.slug,
    );
    if (currentIndex === -1) {
      return null;
    }
    return items[(currentIndex + increment) % items.length].slug;
  };

  const goHome = (): boolean => {
    router.push("/home");
    return true;
  };

  const goToNextItem = (): boolean => {
    const nextItemSlug = getNextItemSlug();
    if (nextItemSlug) {
      router.push(`/item/${nextItemSlug}`);
      return true;
    }
    return false;
  };

  const goToPreviousItem = (): boolean => {
    const previousItemSlug = getNextItemSlug(-1);
    if (previousItemSlug) {
      router.push(`/item/${previousItemSlug}`);
      return true;
    }
    return false;
  };

  const scrollDown = (): boolean => {
    containerRef.current?.scrollBy(0, 300);
    return true;
  };

  const scrollUp = (): boolean => {
    containerRef.current?.scrollBy(0, -300);
    return true;
  };

  const favoriteCurrentItem = async (): Promise<boolean> => {
    if (!loadedItem?.item || !isEditable(loadedItem.item)) {
      return false;
    }
    const currentFavoriteState = loadedItem.item.metadata.isFavorite;
    await updateItemsFavorite([loadedItem.item.slug], !currentFavoriteState);
    return true;
  };

  const archiveCurrentItem = async (
    returnToInbox: boolean,
  ): Promise<boolean> => {
    if (!loadedItem?.item) {
      return false;
    }
    const nextItemSlug = getNextItemSlug();
    return await updateItemsState([loadedItem.item.slug], ItemState.ARCHIVED)
      .then(() => {
        if (returnToInbox) {
          router.push("/inbox");
        } else if (nextItemSlug) {
          router.push(`/item/${nextItemSlug}`);
        }
        return true;
      })
      .catch(() => {
        return false;
      });
  };

  const deleteCurrentItem = async (
    returnToInbox: boolean,
  ): Promise<boolean> => {
    if (!loadedItem?.item) {
      return false;
    }
    const nextItemSlug = getNextItemSlug();
    return await updateItemsState([loadedItem.item.slug], ItemState.DELETED)
      .then(() => {
        if (returnToInbox) {
          router.push("/inbox");
        } else if (nextItemSlug) {
          router.push(`/item/${nextItemSlug}`);
        }
        return true;
      })
      .catch(() => {
        return false;
      });
  };

  useKeyboardShortcut({
    key: "j",
    name: "Scroll down",
    category: ShortcutType.NAVIGATION,
    handler: scrollDown,
    priority: 100,
  });

  useKeyboardShortcut({
    key: "k",
    name: "Scroll up",
    category: ShortcutType.NAVIGATION,
    handler: scrollUp,
    priority: 100,
  });

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
    name: "Archive then open next item",
    category: ShortcutType.ACTIONS,
    handler: () => archiveCurrentItem(false),
    priority: 100,
  });

  useKeyboardShortcut({
    key: "E",
    name: "Archive then return to inbox",
    category: ShortcutType.ACTIONS,
    handler: () => archiveCurrentItem(true),
    priority: 100,
    conditions: {
      shiftKey: true,
    },
  });

  useKeyboardShortcut({
    key: "d",
    name: "Delete then open next item",
    category: ShortcutType.ACTIONS,
    handler: () => deleteCurrentItem(false),
    priority: 100,
  });

  useKeyboardShortcut({
    key: "D",
    name: "Delete then return to inbox",
    category: ShortcutType.ACTIONS,
    handler: () => deleteCurrentItem(true),
    priority: 100,
    conditions: {
      shiftKey: true,
    },
  });

  return null;
};
