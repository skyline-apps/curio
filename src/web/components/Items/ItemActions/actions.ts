"use client";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { useContext } from "react";

import { UpdateFavoriteResponse } from "@/app/api/v1/items/favorite/validation";
import { UpdateStateResponse } from "@/app/api/v1/items/state/validation";
import { showConfirm } from "@/components/ui/Modal/Dialog";
import { ItemState } from "@/db/schema";
import { BrowserMessageContext } from "@/providers/BrowserMessageProvider";
import { CurrentItemContext } from "@/providers/CurrentItemProvider";
import { ItemMetadata, ItemsContext } from "@/providers/ItemsProvider";
import { handleAPIResponse } from "@/utils/api";
import { createLogger } from "@/utils/logger";

const log = createLogger("item-actions");

interface UseItemUpdate {
  updateItemsState: (
    items: ItemMetadata[],
    state: ItemState,
  ) => Promise<UpdateStateResponse>;
  updateItemsFavorite: (
    items: ItemMetadata[],
    favorite: boolean,
  ) => Promise<UpdateFavoriteResponse>;
  refetchItem: (item: ItemMetadata) => Promise<void>;
}

export const useItemUpdate = (): UseItemUpdate => {
  const { invalidateCache, optimisticUpdateItems, optimisticRemoveItems } =
    useContext(ItemsContext);
  const { clearSelectedItems } = useContext(CurrentItemContext);
  const { saveItemContent } = useContext(BrowserMessageContext);

  const updateItemsStateMutationOptions: UseMutationOptions<
    UpdateStateResponse,
    Error,
    { items: ItemMetadata[]; state: ItemState }
  > = {
    mutationFn: async ({ items, state }) => {
      optimisticRemoveItems(items);

      return await fetch("/api/v1/items/state", {
        method: "POST",
        body: JSON.stringify({
          slugs: items.map((item) => item.slug).join(","),
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
    { items: ItemMetadata[]; favorite: boolean }
  > = {
    mutationFn: async ({ items, favorite }) => {
      const newItems = items.map((item) => ({ ...item, isFavorite: favorite }));
      optimisticUpdateItems(newItems);

      return await fetch("/api/v1/items/favorite", {
        method: "POST",
        body: JSON.stringify({
          slugs: items.map((item) => item.slug).join(","),
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
    { item: ItemMetadata }
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
    onSuccess: () => {
      invalidateCache();
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
    items: ItemMetadata[],
    state: ItemState,
  ): Promise<UpdateStateResponse> => {
    return await updateItemsStateMutation.mutateAsync({
      items,
      state,
    });
  };

  const updateItemsFavorite = async (
    items: ItemMetadata[],
    favorite: boolean,
  ): Promise<UpdateFavoriteResponse> => {
    return await updateItemsFavoriteMutation.mutateAsync({
      items,
      favorite,
    });
  };

  const refetchItem = async (item: ItemMetadata): Promise<void> => {
    return await updateItemContentMutation.mutateAsync({ item });
  };

  return { updateItemsState, updateItemsFavorite, refetchItem };
};
