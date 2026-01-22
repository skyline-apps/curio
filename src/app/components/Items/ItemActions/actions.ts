import { showConfirm } from "@app/components/ui/Modal/actions";
import { BrowserMessageContext } from "@app/providers/BrowserMessage";
import { useCache } from "@app/providers/Cache";
import { CurrentItemContext } from "@app/providers/CurrentItem";
import { type Item } from "@app/providers/Items";
import { useToast } from "@app/providers/Toast";
import { ItemState } from "@app/schemas/db";
import { UpdateFavoriteResponse } from "@app/schemas/v1/items/favorite";
import { UpdateLabelsResponse } from "@app/schemas/v1/items/labels";
import {
  MarkUnreadItemResponse,
  ReadItemResponse,
} from "@app/schemas/v1/items/read";
import { SaveResponse } from "@app/schemas/v1/items/save";
import { UpdateStateResponse } from "@app/schemas/v1/items/state";
import { authenticatedFetch, handleAPIResponse } from "@app/utils/api";
import config from "@app/utils/config.json";
import { createLogger } from "@app/utils/logger";
import { isNativePlatform } from "@app/utils/platform";
import { Share } from "@capacitor/share";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
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
  markRead: (item: Item) => Promise<ReadItemResponse>;
  markUnread: (item: Item) => Promise<MarkUnreadItemResponse>;
  refetchItem: (item: Item, useArchive?: boolean) => Promise<void>;
  saveExistingItems: (itemSlugs: string[]) => Promise<void>;
  isSavingExisting: boolean;
  shareItem: (item: Item) => Promise<void>;
}

export const useItemUpdate = (): UseItemUpdate => {
  const { invalidateCache, optimisticUpdateItems, optimisticRemoveItems } =
    useCache();
  const { clearSelectedItems, loadedItem } = useContext(CurrentItemContext);
  const { saveItemContent } = useContext(BrowserMessageContext);
  const { showToast } = useToast();

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

      return await authenticatedFetch("/api/v1/items/state", {
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
      } else {
        invalidateCache();
      }
    },
    onError: (error) => {
      invalidateCache();
      log.error(error.message);
      showToast("Error updating item.");
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

      return await authenticatedFetch("/api/v1/items/favorite", {
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
    onError: (error) => {
      invalidateCache();
      log.error(error.message);
      showToast("Error updating item.");
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

      return await authenticatedFetch("/api/v1/items/labels", {
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
    onError: (error) => {
      invalidateCache();
      log.error(error.message);
      showToast("Error updating item.");
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
          (label: ItemLabel) => label.id !== labelToRemove.id,
        ),
      }));
      optimisticUpdateItems(newItems);

      return await authenticatedFetch("/api/v1/items/labels", {
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
    onError: (error) => {
      invalidateCache();
      log.error(error.message);
      showToast("Error updating item.");
    },
  };

  const markReadMutationOptions: UseMutationOptions<
    ReadItemResponse,
    Error,
    { item: Item }
  > = {
    mutationFn: async ({ item }) => {
      optimisticUpdateItems([
        {
          slug: item.slug,
          metadata: {
            readingProgress: 0,
            lastReadAt: new Date().toISOString(),
          },
        },
      ]);
      return await authenticatedFetch("/api/v1/items/read", {
        method: "POST",
        body: JSON.stringify({ slug: item.slug, readingProgress: 0 }),
      }).then(handleAPIResponse<ReadItemResponse>);
    },
    onSuccess: () => {},
    onError: (error) => {
      invalidateCache();
      log.error(error.message);
      showToast("Error marking item as read.");
    },
  };

  const markUnreadMutationOptions: UseMutationOptions<
    MarkUnreadItemResponse,
    Error,
    { item: Item }
  > = {
    mutationFn: async ({ item }) => {
      optimisticUpdateItems([
        {
          slug: item.slug,
          metadata: { readingProgress: 0, lastReadAt: null },
        },
      ]);
      return await authenticatedFetch("/api/v1/items/read", {
        method: "DELETE",
        body: JSON.stringify({ slug: item.slug }),
      }).then(handleAPIResponse<MarkUnreadItemResponse>);
    },
    onSuccess: () => {},
    onError: (error) => {
      invalidateCache();
      log.error(error.message);
      showToast("Error marking item as unread.");
    },
  };

  const updateItemContentMutationOptions: UseMutationOptions<
    void,
    Error,
    { item: Item; useArchive?: boolean }
  > = {
    mutationFn: async ({ item, useArchive }) => {
      if (!item?.url) return;
      const overrideOpenUrl = useArchive
        ? config.archiveLinkTemplate + item.url
        : undefined;
      if (item.metadata.versionName) {
        showConfirm(
          "Are you sure you want to refresh this item? This will erase any notes, highlights, and reading progress.",
          async () => {
            try {
              await saveItemContent(item.url, overrideOpenUrl);
            } catch (error) {
              log.error("Error refreshing content:", error);
            }
          },
          "Refresh",
        );
      } else {
        try {
          await saveItemContent(item.url, overrideOpenUrl);
        } catch (error) {
          log.error("Error refreshing content:", error);
        }
      }
    },
    onError: (error) => {
      log.error("Error refreshing content:", error);
      showToast("Error refreshing content.");
    },
  };

  const saveItemsMutationOptions: UseMutationOptions<
    void,
    Error,
    { itemSlugs: string[] }
  > = {
    mutationFn: async ({ itemSlugs }) => {
      await authenticatedFetch("/api/v1/items/save", {
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
    onError: (error) => {
      invalidateCache();
      log.error("Error saving items:", error);
      showToast("Error saving items.");
    },
  };

  const updateItemsStateMutation = useMutation(updateItemsStateMutationOptions);
  const updateItemsFavoriteMutation = useMutation(
    updateItemsFavoriteMutationOptions,
  );
  const updateItemsLabelMutation = useMutation(updateItemsLabelMutationOptions);
  const removeItemsLabelMutation = useMutation(removeItemsLabelMutationOptions);
  const markReadMutation = useMutation(markReadMutationOptions);
  const markUnreadMutation = useMutation(markUnreadMutationOptions);
  const updateItemContentMutation = useMutation(
    updateItemContentMutationOptions,
  );
  const saveItemsMutation = useMutation(saveItemsMutationOptions);

  const updateItemsState = async (
    itemSlugs: string[],
    state: ItemState,
  ): Promise<UpdateStateResponse> => {
    updateItemsStateMutation.mutate({
      itemSlugs,
      state,
    });
    return Promise.resolve({
      updated: itemSlugs.map((slug) => ({ slug })),
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

  const markRead = async (item: Item): Promise<ReadItemResponse> => {
    return await markReadMutation.mutateAsync({ item });
  };

  const markUnread = async (item: Item): Promise<MarkUnreadItemResponse> => {
    return await markUnreadMutation.mutateAsync({ item });
  };

  const refetchItem = async (
    item: Item,
    useArchive?: boolean,
  ): Promise<void> => {
    return await updateItemContentMutation.mutateAsync({ item, useArchive });
  };

  const saveExistingItems = async (itemSlugs: string[]): Promise<void> => {
    return await saveItemsMutation.mutateAsync({ itemSlugs });
  };

  const shareItem = async (item: Item): Promise<void> => {
    const itemUrl = `${import.meta.env.VITE_CURIO_URL}/item/${item.slug}`;
    if (isNativePlatform()) {
      await Share.share({
        title: item.metadata.title,
        text: itemUrl,
      });
    } else {
      navigator.clipboard.writeText(itemUrl);
      showToast("Link copied to clipboard.");
    }
  };

  return {
    updateItemsState,
    updateItemsFavorite,
    addItemsLabel,
    removeItemsLabel,
    markRead,
    markUnread,
    refetchItem,
    saveExistingItems,
    isSavingExisting: saveItemsMutation.isPending,
    shareItem,
  };
};
