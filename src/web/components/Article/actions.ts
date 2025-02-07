"use client";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { useContext } from "react";

import { ReadItemResponse } from "@/app/api/v1/items/read/validation";
import { CurrentItemContext } from "@/providers/CurrentItemProvider";
import { ItemsContext } from "@/providers/ItemsProvider";
import { handleAPIResponse } from "@/utils/api";
import { createLogger } from "@/utils/logger";

const log = createLogger("article-actions");

interface UseArticleUpdate {
  updateReadingProgress: (readingProgress: number) => Promise<ReadItemResponse>;
}

export const useArticleUpdate = (): UseArticleUpdate => {
  const { loadedItem } = useContext(CurrentItemContext);
  const { optimisticUpdateItems } = useContext(ItemsContext);

  const updateReadingProgressMutationOptions: UseMutationOptions<
    ReadItemResponse,
    Error,
    { slug: string; readingProgress: number }
  > = {
    mutationFn: async ({ slug, readingProgress }) => {
      return await fetch("/api/v1/items/read", {
        method: "POST",
        body: JSON.stringify({
          slug,
          readingProgress,
        }),
      }).then(handleAPIResponse<ReadItemResponse>);
    },
    onSuccess: () => {},
  };

  const updateReadingProgressMutation = useMutation(
    updateReadingProgressMutationOptions,
  );

  const updateReadingProgress = async (
    readingProgress: number,
  ): Promise<ReadItemResponse> => {
    if (!loadedItem?.item) {
      log.error("Failed to update reading progress, item not loaded");
      throw new Error("Item not loaded");
    }
    optimisticUpdateItems([
      {
        ...loadedItem.item,
        metadata: { ...loadedItem.item.metadata, readingProgress },
      },
    ]);
    return await updateReadingProgressMutation.mutateAsync({
      slug: loadedItem.item.slug,
      readingProgress,
    });
  };

  return { updateReadingProgress };
};
