"use client";
import React, { useContext } from "react";
import { LuBird, LuPartyPopper } from "react-icons/lu";
import InfiniteScroll from "react-infinite-scroll-component";

import ItemsActions from "@/components/Items/ItemList/ItemsActions";
import ItemsContainer from "@/components/Items/ItemList/ItemsContainer";
import ItemSearch from "@/components/Items/ItemList/ItemSearch";
import Icon from "@/components/ui/Icon";
import { ItemsContext } from "@/providers/ItemsProvider";

interface InfiniteItemListProps {
  loadMore: () => void;
}

const ItemList: React.FC<InfiniteItemListProps> = ({
  loadMore,
}: InfiniteItemListProps) => {
  const { hasMore, items, totalItems, loadingError } = useContext(ItemsContext);

  return (
    <>
      <div className="flex h-8 w-full items-end gap-2 mb-2">
        <ItemSearch />
        <ItemsActions />
      </div>
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
                  <Icon
                    className="text-secondary-800"
                    icon={<LuPartyPopper />}
                  />
                </>
              )}
            </div>
          }
          scrollableTarget="scrollableDiv"
          scrollThreshold={0.8}
        >
          <ItemsContainer />
        </InfiniteScroll>
      </div>
    </>
  );
};

export default ItemList;
