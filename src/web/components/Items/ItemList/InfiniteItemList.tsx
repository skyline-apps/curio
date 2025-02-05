"use client";
import React, { useContext } from "react";
import { LuBird, LuPartyPopper } from "react-icons/lu";
import InfiniteScroll from "react-infinite-scroll-component";

import ItemList from "@/components/Items/ItemList";
import Icon from "@/components/ui/Icon";
import { ItemsContext } from "@/providers/ItemsProvider";

interface InfiniteItemListProps {
  loadMore: () => void;
}

const InfiniteItemList: React.FC<InfiniteItemListProps> = ({
  loadMore,
}: InfiniteItemListProps) => {
  const { hasMore, items, totalItems, loadingError } = useContext(ItemsContext);

  return (
    <div id="scrollableDiv" className="h-full overflow-auto flex flex-col">
      <InfiniteScroll
        dataLength={items.length}
        next={loadMore}
        hasMore={hasMore}
        loader={<></>}
        endMessage={
          <div className="flex flex-row items-center justify-center py-8 text-secondary-800 gap-2">
            {loadingError ? (
              <>
                <p>{loadingError}</p>
              </>
            ) : totalItems === 0 ? (
              <>
                <p>Nothing here yet.</p>
                <Icon className="text-secondary-800" icon={<LuBird />} />
              </>
            ) : (
              <>
                <p>You&apos;re all caught up!</p>
                <Icon className="text-secondary-800" icon={<LuPartyPopper />} />
              </>
            )}
          </div>
        }
        scrollableTarget="scrollableDiv"
        scrollThreshold={0.8}
      >
        <ItemList />
      </InfiniteScroll>
    </div>
  );
};

export default InfiniteItemList;
