"use client";
import { useVirtualizer } from "@tanstack/react-virtual";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import ItemCard from "@web/components/Items/ItemCard";
import { CurrentItemContext } from "@web/providers/CurrentItemProvider";
import { type Item, type PublicItem } from "@web/providers/ItemsProvider";

interface ItemGridProps {
  items: (PublicItem | Item)[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
}

// Keep in sync with dimensions of ItemCard/index.tsx
const CARD_WIDTH = 288; // w-80
const CARD_HEIGHT = 384; // h-96
const GAP = 16; // gap-4

const ItemGrid: React.FC<ItemGridProps> = ({
  items,
  onLoadMore,
  hasMore = false,
  isLoading = false,
  emptyMessage,
}: ItemGridProps) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const { previewItem } = useContext(CurrentItemContext);

  // Calculate number of columns based on container width
  const columnCount = useMemo(() => {
    if (containerWidth === 0) return 1;
    return Math.max(1, Math.floor(containerWidth / (CARD_WIDTH + GAP)));
  }, [containerWidth]);

  // Calculate number of rows needed
  const rowCount = Math.ceil(items.length / columnCount) + (hasMore ? 1 : 0);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => CARD_HEIGHT + GAP,
    overscan: 5,
  });

  const handleScroll = useCallback(() => {
    const scrollElement = parentRef.current;
    if (
      !scrollElement ||
      loadingRef.current ||
      !hasMore ||
      isLoading ||
      !onLoadMore
    )
      return;

    const { scrollTop, scrollHeight, clientHeight } = scrollElement;
    const scrolledPercentage = (scrollTop + clientHeight) / scrollHeight;

    if (scrolledPercentage > 0.8) {
      loadingRef.current = true;
      onLoadMore();
    }
  }, [hasMore, isLoading, onLoadMore]);

  // Reset loading ref when isLoading changes
  useEffect(() => {
    loadingRef.current = false;
  }, [isLoading]);

  // Add scroll listener
  useEffect(() => {
    const scrollElement = parentRef.current;
    if (!scrollElement) return;

    scrollElement.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollElement.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Add resize observer
  useEffect(() => {
    const element = parentRef.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) {
        setContainerWidth(width);
      }
    });

    observer.observe(element);
    setContainerWidth(element.offsetWidth);

    return () => observer.disconnect();
  }, []);

  if (items.length === 0) {
    return (
      <div className="w-full flex justify-center my-8 text-sm text-secondary">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="w-full h-full overflow-auto"
      style={{
        contain: "strict",
      }}
    >
      <div
        className="relative w-full"
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const rowStartIndex = virtualRow.index * columnCount;
          const rowItems = items.slice(
            rowStartIndex,
            rowStartIndex + columnCount,
          );

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              className="absolute left-0 w-full flex gap-4"
              style={{
                transform: `translateY(${virtualRow.start}px)`,
                height: `${virtualRow.size}px`,
              }}
            >
              {rowItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onPress={() => {
                    previewItem(item);
                  }}
                />
              ))}
            </div>
          );
        })}

        {/* Loading indicator */}
        {hasMore && (
          <div
            className="absolute w-full h-16 flex items-center justify-center text-sm text-secondary"
            style={{
              bottom: 0,
            }}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                Loading more items...
              </div>
            ) : (
              <div className="opacity-50">Scroll to load more</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemGrid;
