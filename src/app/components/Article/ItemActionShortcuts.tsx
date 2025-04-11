import { useItemUpdate } from "@app/components/Items/ItemActions/actions";
import { useAppPage } from "@app/providers/AppPage";
import { CurrentItemContext } from "@app/providers/CurrentItem";
import { ItemsContext } from "@app/providers/Items";
import {
  ShortcutType,
  useKeyboardShortcuts,
} from "@app/providers/KeyboardShortcuts";
import { ItemState } from "@app/schemas/db";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";

export const ItemActionShortcuts = (): null => {
  const { items } = useContext(ItemsContext);
  const { loadedItem, isEditable } = useContext(CurrentItemContext);

  const { updateItemsState, updateItemsFavorite } = useItemUpdate();

  const navigate = useNavigate();
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
    navigate("/home");
    return true;
  };

  const goToNextItem = (): boolean => {
    const nextItemSlug = getNextItemSlug();
    if (nextItemSlug) {
      navigate(`/item/${nextItemSlug}`);
      return true;
    }
    return false;
  };

  const goToPreviousItem = (): boolean => {
    const previousItemSlug = getNextItemSlug(-1);
    if (previousItemSlug) {
      navigate(`/item/${previousItemSlug}`);
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
          navigate("/inbox");
        } else if (nextItemSlug) {
          navigate(`/item/${nextItemSlug}`);
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
          navigate("/inbox");
        } else if (nextItemSlug) {
          navigate(`/item/${nextItemSlug}`);
        }
        return true;
      })
      .catch(() => {
        return false;
      });
  };

  const scrollToAnchor = (next: boolean = true): boolean => {
    const container = containerRef.current;
    if (!container) {
      return false;
    }

    const headers = Array.from(
      container.querySelectorAll<HTMLHeadingElement>("h1, h2, h3, h4, h5, h6"),
    );

    if (headers.length === 0) {
      return false;
    }

    const currentScrollTop = container.scrollTop;
    let targetAnchor: HTMLHeadingElement | null = null;
    let previousAnchor: HTMLHeadingElement | null = null;

    const containerTop = container.getBoundingClientRect().top;

    for (const header of headers) {
      const headerTopRelativeToViewport = header.getBoundingClientRect().top;
      const headerTopRelativeToContainer =
        headerTopRelativeToViewport - containerTop;

      if (next) {
        if (headerTopRelativeToContainer > 1) {
          targetAnchor = header;
          break;
        }
      } else {
        if (headerTopRelativeToContainer < -1) {
          previousAnchor = header;
        } else {
          targetAnchor = previousAnchor;
          break;
        }
      }
    }

    if (!next && !targetAnchor) {
      targetAnchor = previousAnchor;
    }

    if (targetAnchor) {
      container.scrollTo({
        top:
          currentScrollTop +
          (targetAnchor.getBoundingClientRect().top - containerTop),
        behavior: "smooth",
      });
      return true;
    }

    return false;
  };

  useKeyboardShortcuts({
    key: "j",
    name: "Scroll down",
    category: ShortcutType.NAVIGATION,
    handler: scrollDown,
    priority: 100,
  });

  useKeyboardShortcuts({
    key: "k",
    name: "Scroll up",
    category: ShortcutType.NAVIGATION,
    handler: scrollUp,
    priority: 100,
  });

  useKeyboardShortcuts({
    key: "Escape",
    name: "Go home",
    category: ShortcutType.NAVIGATION,
    handler: goHome,
    priority: 100,
  });

  useKeyboardShortcuts({
    key: "n",
    name: "Open next item",
    category: ShortcutType.NAVIGATION,
    handler: goToNextItem,
    priority: 100,
  });

  useKeyboardShortcuts({
    key: "p",
    name: "Open previous item",
    category: ShortcutType.NAVIGATION,
    handler: goToPreviousItem,
    priority: 100,
  });

  useKeyboardShortcuts({
    key: "J",
    name: "Scroll to next section",
    category: ShortcutType.NAVIGATION,
    handler: () => scrollToAnchor(true),
    priority: 100,
    conditions: {
      shiftKey: true,
    },
  });

  useKeyboardShortcuts({
    key: "K",
    name: "Scroll to previous section",
    category: ShortcutType.NAVIGATION,
    handler: () => scrollToAnchor(false),
    priority: 100,
    conditions: {
      shiftKey: true,
    },
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
    name: "Archive then open next item",
    category: ShortcutType.ACTIONS,
    handler: () => archiveCurrentItem(false),
    priority: 100,
  });

  useKeyboardShortcuts({
    key: "E",
    name: "Archive then return to inbox",
    category: ShortcutType.ACTIONS,
    handler: () => archiveCurrentItem(true),
    priority: 100,
    conditions: {
      shiftKey: true,
    },
  });

  useKeyboardShortcuts({
    key: "d",
    name: "Delete then open next item",
    category: ShortcutType.ACTIONS,
    handler: () => deleteCurrentItem(false),
    priority: 100,
  });

  useKeyboardShortcuts({
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
