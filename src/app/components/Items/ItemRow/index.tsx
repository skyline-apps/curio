import Favicon from "@app/components/Image/Favicon";
import ItemActions from "@app/components/Items/ItemActions";
import { useItemUpdate } from "@app/components/Items/ItemActions/actions";
import { useOfflineArticle } from "@app/components/Items/useOfflineArticle";
import Labels from "@app/components/Labels";
import Markdown from "@app/components/Markdown";
import Icon from "@app/components/ui/Icon";
import { CurrentItemContext } from "@app/providers/CurrentItem";
import { type Item, ItemsContext } from "@app/providers/Items";
import { useSwipeSettings } from "@app/providers/Settings";
import { useToast } from "@app/providers/Toast";
import { ItemSource, ItemState } from "@app/schemas/db";
import { FALLBACK_HOSTNAME } from "@app/schemas/types";
import { cn } from "@app/utils/cn";
import { SwipeAction } from "@app/utils/displayStorage";
import React, { useContext, useRef, useState } from "react";
import { HiCheck, HiOutlineEnvelope } from "react-icons/hi2";
import { Link } from "react-router-dom";

import {
  getSwipeActionDetails,
  SWIPE_THRESHOLD,
  SwipeActionDetails,
} from "./swipe";

interface ItemRowProps {
  item: Item;
  index: number;
  onClick?: (ev: React.MouseEvent) => void;
  onLongPress?: (ev: React.TouchEvent) => void;
  onSwipeAction?: (action: SwipeAction) => void;
  enablePointerDrag?: boolean;
}

const ItemRow: React.FC<ItemRowProps> = ({
  item,
  index,
  onClick,
  onLongPress,
  onSwipeAction,
  enablePointerDrag = false,
}: ItemRowProps) => {
  const { searchQuery } = useContext(ItemsContext);
  const { currentItem, selectedItems, lastSelectionIndex, selectItems } =
    useContext(CurrentItemContext);
  const { updateItemsState, updateItemsFavorite, markRead, markUnread } =
    useItemUpdate();
  const { swipeSettings } = useSwipeSettings();
  const { showToast } = useToast();
  const {
    isSavedOffline,
    isUnavailableOffline,
    downloadArticleOffline,
    removeArticleOffline,
  } = useOfflineArticle(item.slug);

  const [translateX, setTranslateX] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const currentTranslateX = useRef<number>(0);
  const timer = useRef<number | null>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const gestureState = useRef<"none" | "swiping" | "scrolling">("none");
  const hasVibrated = useRef<boolean>(false);
  const justSwiped = useRef<boolean>(false);
  const isPointerDown = useRef<boolean>(false);

  const isRead = item.metadata.lastReadAt !== null;

  const getHostname = (url: string | null): string =>
    url
      ? new URL(url).hostname
          .replace(/www./, "")
          .replace(FALLBACK_HOSTNAME, "newsletter")
      : "";

  const rightActionDetails: SwipeActionDetails | null = getSwipeActionDetails(
    swipeSettings.swipeRightAction,
    item,
    isSavedOffline,
  );
  const leftActionDetails: SwipeActionDetails | null = getSwipeActionDetails(
    swipeSettings.swipeLeftAction,
    item,
    isSavedOffline,
  );

  const executeSwipeAction = async (action: SwipeAction): Promise<void> => {
    if (onSwipeAction) {
      onSwipeAction(action);
      return;
    }

    const isArchived = item.metadata.state === ItemState.ARCHIVED;
    const isDeleted = item.metadata.state === ItemState.DELETED;
    const isFavorite = !!item.metadata.isFavorite;

    switch (action) {
      case SwipeAction.ARCHIVE:
        await updateItemsState(
          [item.slug],
          isArchived ? ItemState.ACTIVE : ItemState.ARCHIVED,
        );
        showToast(isArchived ? "Unarchived item" : "Archived item", {
          disappearing: true,
        });
        break;
      case SwipeAction.DELETE:
        await updateItemsState(
          [item.slug],
          isDeleted ? ItemState.ACTIVE : ItemState.DELETED,
        );
        showToast(isDeleted ? "Restored item" : "Deleted item", {
          disappearing: true,
        });
        break;
      case SwipeAction.MARK_READ:
        if (isRead) {
          await markUnread(item);
          showToast("Marked as unread", { disappearing: true });
        } else {
          await markRead(item);
          showToast("Marked as read", { disappearing: true });
        }
        break;
      case SwipeAction.FAVORITE:
        await updateItemsFavorite([item.slug], !isFavorite);
        showToast(
          isFavorite ? "Removed from favorites" : "Added to favorites",
          {
            disappearing: true,
          },
        );
        break;
      case SwipeAction.READ_OFFLINE:
        if (isSavedOffline) {
          removeArticleOffline(item.slug);
        } else {
          try {
            await downloadArticleOffline(item.slug);
          } catch {
            // Toast and logging handled in downloadArticleOffline
          }
        }
        break;
      case SwipeAction.NONE:
      default:
        break;
    }
  };

  const handleTouchStart = (clientX: number, clientY: number): void => {
    if (justSwiped.current) return;
    touchStartX.current = clientX;
    touchStartY.current = clientY;
    currentTranslateX.current = 0;
    gestureState.current = "none";
    hasVibrated.current = false;
  };

  const handleTouchMove = (clientX: number, clientY: number): void => {
    if (gestureState.current === "scrolling") {
      return;
    }

    const dx = clientX - touchStartX.current;
    const dy = clientY - touchStartY.current;

    if (gestureState.current === "none") {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 5) {
        gestureState.current = "scrolling";
        return;
      } else if (Math.abs(dx) > 10) {
        gestureState.current = "swiping";
        setIsDragging(true);
        if (timer.current) {
          clearTimeout(timer.current);
          timer.current = null;
        }
      }
    }

    if (gestureState.current === "swiping") {
      const action =
        dx > 0 ? swipeSettings.swipeRightAction : swipeSettings.swipeLeftAction;

      let appliedX = dx;
      if (action === SwipeAction.NONE) {
        appliedX = Math.sign(dx) * Math.min(Math.abs(dx) * 0.15, 25);
      }

      currentTranslateX.current = appliedX;
      setTranslateX(appliedX);

      if (Math.abs(appliedX) >= SWIPE_THRESHOLD && !hasVibrated.current) {
        hasVibrated.current = true;
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          try {
            navigator.vibrate(10);
          } catch {
            // Ignore vibration errors
          }
        }
      } else if (Math.abs(appliedX) < SWIPE_THRESHOLD && hasVibrated.current) {
        hasVibrated.current = false;
      }
    }
  };

  const handleTouchEnd = (): void => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }

    if (gestureState.current === "swiping") {
      gestureState.current = "none";
      setIsDragging(false);

      const finalTranslateX = currentTranslateX.current;

      if (Math.abs(finalTranslateX) >= SWIPE_THRESHOLD) {
        const action =
          finalTranslateX > 0
            ? swipeSettings.swipeRightAction
            : swipeSettings.swipeLeftAction;

        if (action !== SwipeAction.NONE) {
          justSwiped.current = true;
          window.setTimeout(() => {
            justSwiped.current = false;
          }, 250);

          if (
            !onSwipeAction &&
            (action === SwipeAction.ARCHIVE || action === SwipeAction.DELETE)
          ) {
            const screenWidth =
              typeof window !== "undefined" ? window.innerWidth : 400;
            currentTranslateX.current =
              Math.sign(finalTranslateX) * screenWidth;
            setTranslateX(currentTranslateX.current);
            window.setTimeout(async () => {
              try {
                await executeSwipeAction(action);
              } finally {
                currentTranslateX.current = 0;
                setTranslateX(0);
              }
            }, 150);
          } else {
            currentTranslateX.current = 0;
            setTranslateX(0);
            void executeSwipeAction(action);
          }
          return;
        }
      }

      currentTranslateX.current = 0;
      setTranslateX(0);
    }
  };

  return (
    <div
      key={item.id}
      className="relative w-full h-16 rounded-sm overflow-hidden select-none"
      dir={item.metadata.textDirection}
      data-testid={`item-row-container-${item.slug}`}
      data-swipeable="true"
    >
      {/* Background action layer */}
      {translateX > 0 && rightActionDetails && (
        <div
          className={`absolute inset-0 flex items-center justify-start pl-4 ${rightActionDetails.bgColor} ${rightActionDetails.textColor}`}
          data-testid="swipe-action-right-bg"
        >
          <div
            className={`flex flex-row items-center gap-2 transition-transform duration-100 ${
              translateX >= SWIPE_THRESHOLD
                ? "scale-105"
                : "scale-95 opacity-80"
            }`}
          >
            {rightActionDetails.icon}
            <span className="text-sm font-medium">
              {rightActionDetails.label}
            </span>
          </div>
        </div>
      )}

      {translateX < 0 && leftActionDetails && (
        <div
          className={`absolute inset-0 flex items-center justify-end pr-4 ${leftActionDetails.bgColor} ${leftActionDetails.textColor}`}
          data-testid="swipe-action-left-bg"
        >
          <div
            className={`flex flex-row items-center gap-2 transition-transform duration-100 ${
              Math.abs(translateX) >= SWIPE_THRESHOLD
                ? "scale-105"
                : "scale-95 opacity-80"
            }`}
          >
            <span className="text-sm font-medium">
              {leftActionDetails.label}
            </span>
            {leftActionDetails.icon}
          </div>
        </div>
      )}

      {/* Foreground item card */}
      <div
        className={cn(
          "w-full h-full group flex flex-row bg-background-400 pl-4 pr-1 py-1 rounded-sm hover:bg-background-300 data-[selected=true]:bg-background-300 data-[focus=true]:outline-focus data-[focus=true]:outline",
          isUnavailableOffline &&
            "opacity-40 grayscale pointer-events-none select-none",
        )}
        data-testid={`item-row-card-${item.slug}`}
        data-offline-disabled={isUnavailableOffline ? "true" : undefined}
        data-swipeable="true"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? "none" : "transform 200ms ease-out",
          touchAction: "pan-y",
        }}
        onClick={(e: React.MouseEvent) => {
          if (justSwiped.current) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          onClick?.(e);
        }}
        onTouchStart={(e: React.TouchEvent) => {
          if (timer.current) clearTimeout(timer.current);
          timer.current = window.setTimeout(() => {
            onLongPress?.(e);
          }, 500);
          handleTouchStart(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchMove={(e: React.TouchEvent) => {
          handleTouchMove(e.touches[0].clientX, e.touches[0].clientY);
          if (gestureState.current === "swiping") {
            e.stopPropagation();
          }
        }}
        onTouchEnd={(e: React.TouchEvent) => {
          if (gestureState.current === "swiping") {
            e.stopPropagation();
          }
          handleTouchEnd();
        }}
        onTouchCancel={(e: React.TouchEvent) => {
          if (gestureState.current === "swiping") {
            e.stopPropagation();
          }
          handleTouchEnd();
        }}
        onPointerDown={
          enablePointerDrag
            ? (e: React.PointerEvent) => {
                if (e.pointerType === "mouse" && e.button !== 0) return;
                isPointerDown.current = true;
                handleTouchStart(e.clientX, e.clientY);
              }
            : undefined
        }
        onPointerMove={
          enablePointerDrag
            ? (e: React.PointerEvent) => {
                if (isPointerDown.current) {
                  handleTouchMove(e.clientX, e.clientY);
                  if (gestureState.current === "swiping") {
                    e.stopPropagation();
                  }
                }
              }
            : undefined
        }
        onPointerUp={
          enablePointerDrag
            ? (e: React.PointerEvent) => {
                if (gestureState.current === "swiping") {
                  e.stopPropagation();
                }
                isPointerDown.current = false;
                handleTouchEnd();
              }
            : undefined
        }
        data-selected={
          selectedItems.has(item.slug) || currentItem?.id === item.id
            ? true
            : undefined
        }
        data-focus={
          (lastSelectionIndex === index && currentItem?.id !== item.id) ||
          (selectedItems.size === 1 && selectedItems.has(item.slug))
        }
        data-active={currentItem?.id === item.id}
      >
        <div className="flex flex-row gap-2 justify-between items-start w-full">
          <div className="grow h-full block overflow-hidden">
            <div className="flex flex-row gap-2 items-center h-6">
              <div className="flex shrink-0 items-center justify-center w-4 h-4">
                {item.metadata.source === ItemSource.EMAIL ? (
                  <Icon icon={<HiOutlineEnvelope />} />
                ) : (
                  <Favicon
                    className={isRead ? "opacity-50" : ""}
                    url={item.metadata.favicon}
                  />
                )}
              </div>
              <Link
                to={`/item/${item.slug}`}
                className="text-sm shrink-0 text-foreground hover:underline truncate"
                onClick={(e) => {
                  if (justSwiped.current || isUnavailableOffline) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                  }
                  e.stopPropagation();
                  selectItems([item.slug], index, { showSidebar: false });
                }}
              >
                {isRead ? (
                  <div className="text-secondary-600">
                    {item.metadata.title}
                  </div>
                ) : (
                  <div className="font-bold">{item.metadata.title}</div>
                )}
              </Link>
              <p className="text-xs text-secondary-700 hidden md:block">
                {getHostname(item.url)}
              </p>
              {item.labels && item.labels.length > 0 && (
                <div className="hidden md:block max-h-6 overflow-hidden">
                  <Labels mode="view" labels={item.labels} truncate />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1">
              {item.excerpt && searchQuery ? (
                <Markdown
                  className="[&_*]:text-secondary-700 [&_*]:text-xs [&_*]:my-0 text-wrap truncate"
                  components={{
                    strong: ({ children }) => (
                      <strong className="!text-foreground">{children}</strong>
                    ),
                  }}
                >
                  {item.excerpt}
                </Markdown>
              ) : (
                <p className="text-xs text-secondary-700 text-wrap truncate">
                  {item.metadata.description}
                </p>
              )}
            </div>
          </div>
          <ItemActions
            item={item}
            className="hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          />
        </div>
        <Icon
          icon={<HiCheck />}
          className="absolute bottom-2 right-2 opacity-0 group-data-[selected=true]:group-data-[active=false]:opacity-100 transition-opacity duration-200 bg-background-400"
        />
      </div>
    </div>
  );
};

export default ItemRow;
