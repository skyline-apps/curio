"use client";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { useContext } from "react";

import { UpdateFavoriteResponse } from "@/app/api/v1/items/favorite/validation";
import { UpdateStateResponse } from "@/app/api/v1/items/state/validation";
import { showConfirm } from "@/components/ui/Modal/Dialog";
import { ItemState } from "@/db/schema";
import { BrowserMessageContext } from "@/providers/BrowserMessageProvider";
import { useCache } from "@/providers/CacheProvider";
import { CurrentItemContext } from "@/providers/CurrentItemProvider";
import { Item } from "@/providers/ItemsProvider";
import { handleAPIResponse } from "@/utils/api";
import { createLogger } from "@/utils/logger";

const log = createLogger("item-actions");

interface UseItemUpdate {
  updateItemsState: (
    itemSlugs: string[],
    state: ItemState,
  ) => Promise<UpdateStateResponse>;
  updateItemsFavorite: (
    itemSlugs: string[],
    favorite: boolean,
  ) => Promise<UpdateFavoriteResponse>;
  refetchItem: (item: Item) => Promise<void>;
}

export const useItemUpdate = (): UseItemUpdate => {
  const { invalidateCache, optimisticUpdateItems, optimisticRemoveItems } =
    useCache();
  const { clearSelectedItems } = useContext(CurrentItemContext);
  const { saveItemContent } = useContext(BrowserMessageContext);

  const updateItemsStateMutationOptions: UseMutationOptions<
    UpdateStateResponse,
    Error,
    { itemSlugs: string[]; state: ItemState }
  > = {
    mutationFn: async ({ itemSlugs, state }) => {
      optimisticRemoveItems(itemSlugs);

      return await fetch("/api/v1/items/state", {
        method: "POST",
        body: JSON.stringify({
          slugs: itemSlugs.join(","),
          state,
        }),
      }).then(handleAPIResponse<UpdateStateResponse>);
    },
    onSuccess: () => {
      invalidateCache();
      clearSelectedItems();
    },
  };

  const updateItemsFavoriteMutationOptions: UseMutationOptions<
    UpdateFavoriteResponse,
    Error,
    { itemSlugs: string[]; favorite: boolean }
  > = {
    mutationFn: async ({ itemSlugs, favorite }) => {
      const newItems = itemSlugs.map((slug) => ({
        slug,
        metadata: {
          isFavorite: favorite,
        },
      }));
      optimisticUpdateItems(newItems);

      return await fetch("/api/v1/items/favorite", {
        method: "POST",
        body: JSON.stringify({
          slugs: itemSlugs.join(","),
          favorite,
        }),
      }).then(handleAPIResponse<UpdateFavoriteResponse>);
    },
    onSuccess: () => {
      invalidateCache();
    },
  };

  const updateItemContentMutationOptions: UseMutationOptions<
    void,
    Error,
    { item: Item }
  > = {
    mutationFn: async ({ item }) => {
      if (!item?.url) return;
      if (item.metadata.versionName) {
        showConfirm(
          "Are you sure you want to refresh this item? This will erase any notes, highlights, and reading progress.",
          async () => {
            try {
              await saveItemContent(item.url);
            } catch (error) {
              log.error("Error refreshing content:", error);
            }
          },
          "Refresh",
        );
      } else {
        try {
          await saveItemContent(item.url);
        } catch (error) {
          log.error("Error refreshing content:", error);
        }
      }
    },
  };

  const updateItemsStateMutation = useMutation(updateItemsStateMutationOptions);
  const updateItemsFavoriteMutation = useMutation(
    updateItemsFavoriteMutationOptions,
  );
  const updateItemContentMutation = useMutation(
    updateItemContentMutationOptions,
  );

  const updateItemsState = async (
    itemSlugs: string[],
    state: ItemState,
  ): Promise<UpdateStateResponse> => {
    return await updateItemsStateMutation.mutateAsync({
      itemSlugs,
      state,
    });
  };

  const updateItemsFavorite = async (
    itemSlugs: string[],
    favorite: boolean,
  ): Promise<UpdateFavoriteResponse> => {
    return await updateItemsFavoriteMutation.mutateAsync({
      itemSlugs,
      favorite,
    });
  };

  const refetchItem = async (item: Item): Promise<void> => {
    return await updateItemContentMutation.mutateAsync({ item });
  };

  return { updateItemsState, updateItemsFavorite, refetchItem };
};
