"use client";
import { useVirtualizer } from "@tanstack/react-virtual";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import ItemCard from "@/components/Items/ItemCard";
import { type PublicItem } from "@/providers/ItemsProvider";

interface ItemGridProps {
  items: PublicItem[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
}

const CARD_WIDTH = 320; // w-80
const CARD_HEIGHT = 384; // h-96
const GAP = 16; // gap-4

const ItemGrid: React.FC<ItemGridProps> = ({
  items,
  onLoadMore,
  hasMore = false,
  isLoading = false,
}: ItemGridProps) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const [containerWidth, setContainerWidth] = useState(0);

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
                <ItemCard key={item.profileItemId || item.id} item={item} />
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
