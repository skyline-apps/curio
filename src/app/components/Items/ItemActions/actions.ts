import { showConfirm } from "@app/components/ui/Modal/Dialog";
import { BrowserMessageContext } from "@app/providers/BrowserMessage";
import { useCache } from "@app/providers/Cache";
import { CurrentItemContext } from "@app/providers/CurrentItem";
import { type Item } from "@app/providers/Items";
import { handleAPIResponse } from "@app/utils/api";
import { createLogger } from "@app/utils/logger";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { UpdateFavoriteResponse } from "@web/app/api/v1/items/favorite/validation";
import { UpdateLabelsResponse } from "@web/app/api/v1/items/labels/validation";
import { SaveResponse } from "@web/app/api/v1/items/save/validation";
import { UpdateStateResponse } from "@web/app/api/v1/items/state/validation";
import { ItemState } from "@web/db/schema";
import { useContext } from "react";

const log = createLogger("item-actions");

type ItemLabel = Item["labels"][0];

interface UseItemUpdate {
  updateItemsState: (
    itemSlugs: string[],
    state: ItemState,
  ) => Promise<UpdateStateResponse>;
  updateItemsFavorite: (
    itemSlugs: string[],
    favorite: boolean,
  ) => Promise<UpdateFavoriteResponse>;
  addItemsLabel: (
    items: Item[],
    labelToAdd: ItemLabel,
  ) => Promise<UpdateLabelsResponse>;
  removeItemsLabel: (
    items: Item[],
    labelToRemove: ItemLabel,
  ) => Promise<UpdateLabelsResponse>;
  refetchItem: (item: Item) => Promise<void>;
  saveExistingItems: (itemSlugs: string[]) => Promise<void>;
  isSavingExisting: boolean;
}

export const useItemUpdate = (): UseItemUpdate => {
  const { invalidateCache, optimisticUpdateItems, optimisticRemoveItems } =
    useCache();
  const { clearSelectedItems, loadedItem } = useContext(CurrentItemContext);
  const { saveItemContent } = useContext(BrowserMessageContext);

  const updateItemsStateMutationOptions: UseMutationOptions<
    UpdateStateResponse,
    Error,
    { itemSlugs: string[]; state: ItemState }
  > = {
    mutationFn: async ({ itemSlugs, state }) => {
      const newItems = itemSlugs.map((slug) => ({
        slug,
        metadata: {
          state,
        },
      }));
      optimisticUpdateItems(newItems);
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
      if (!loadedItem) {
        invalidateCache();
        clearSelectedItems();
      }
    },
    onError: () => {
      invalidateCache();
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
    onError: () => {
      invalidateCache();
    },
  };

  const updateItemsLabelMutationOptions: UseMutationOptions<
    UpdateLabelsResponse,
    Error,
    {
      items: Item[];
      labelToAdd: ItemLabel;
    }
  > = {
    mutationFn: async ({ items, labelToAdd }) => {
      const newItems = items.map((item) => ({
        ...item,
        labels: [...(item.labels || []), labelToAdd],
      }));
      optimisticUpdateItems(newItems);

      return await fetch("/api/v1/items/labels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slugs: items.map((item) => item.slug).join(","),
          labelIds: [labelToAdd.id],
        }),
      }).then(handleAPIResponse<UpdateLabelsResponse>);
    },
    onSuccess: () => {
      if (!loadedItem) {
        invalidateCache();
      }
    },
    onError: () => {
      invalidateCache();
    },
  };

  const removeItemsLabelMutationOptions: UseMutationOptions<
    UpdateLabelsResponse,
    Error,
    {
      items: Item[];
      labelToRemove: ItemLabel;
    }
  > = {
    mutationFn: async ({ items, labelToRemove }) => {
      const newItems = items.map((item) => ({
        ...item,
        labels: (item.labels || []).filter(
          (label) => label.id !== labelToRemove.id,
        ),
      }));
      optimisticUpdateItems(newItems);

      return await fetch("/api/v1/items/labels", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slugs: items.map((item) => item.slug).join(","),
          labelIds: [labelToRemove.id],
        }),
      }).then(handleAPIResponse<UpdateLabelsResponse>);
    },
    onSuccess: () => {
      if (!loadedItem) {
        invalidateCache();
      }
    },
    onError: () => {
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

  const saveItemsMutationOptions: UseMutationOptions<
    void,
    Error,
    { itemSlugs: string[] }
  > = {
    mutationFn: async ({ itemSlugs }) => {
      await fetch("/api/v1/items/save", {
        method: "POST",
        body: JSON.stringify({
          slugs: itemSlugs.join(","),
        }),
      })
        .then(handleAPIResponse<SaveResponse>)
        .then((result) => {
          optimisticUpdateItems(result.updated);
        });
    },
    onSuccess: () => {
      invalidateCache();
    },
    onError: () => {
      invalidateCache();
    },
  };

  const updateItemsStateMutation = useMutation(updateItemsStateMutationOptions);
  const updateItemsFavoriteMutation = useMutation(
    updateItemsFavoriteMutationOptions,
  );
  const updateItemsLabelMutation = useMutation(updateItemsLabelMutationOptions);
  const removeItemsLabelMutation = useMutation(removeItemsLabelMutationOptions);
  const updateItemContentMutation = useMutation(
    updateItemContentMutationOptions,
  );
  const saveItemsMutation = useMutation(saveItemsMutationOptions);

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

  const addItemsLabel = async (
    items: Item[],
    labelToAdd: ItemLabel,
  ): Promise<UpdateLabelsResponse> => {
    return await updateItemsLabelMutation.mutateAsync({
      items,
      labelToAdd,
    });
  };

  const removeItemsLabel = async (
    items: Item[],
    labelToRemove: ItemLabel,
  ): Promise<UpdateLabelsResponse> => {
    return await removeItemsLabelMutation.mutateAsync({
      items,
      labelToRemove,
    });
  };

  const refetchItem = async (item: Item): Promise<void> => {
    return await updateItemContentMutation.mutateAsync({ item });
  };

  const saveExistingItems = async (itemSlugs: string[]): Promise<void> => {
    return await saveItemsMutation.mutateAsync({ itemSlugs });
  };

  return {
    updateItemsState,
    updateItemsFavorite,
    addItemsLabel,
    removeItemsLabel,
    refetchItem,
    saveExistingItems,
    isSavingExisting: saveItemsMutation.isPending,
  };
};
