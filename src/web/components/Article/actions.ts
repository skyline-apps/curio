"use client";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { ReadItemResponse } from "@web/app/api/v1/items/read/validation";
import { useCache } from "@web/providers/CacheProvider";
import { CurrentItemContext } from "@web/providers/CurrentItemProvider";
import { handleAPIResponse } from "@web/utils/api";
import { createLogger } from "@web/utils/logger";
import { useContext } from "react";

const log = createLogger("article-actions");

interface UseArticleUpdate {
  updateReadingProgress: (readingProgress: number) => Promise<ReadItemResponse>;
}

export const useArticleUpdate = (): UseArticleUpdate => {
  const { loadedItem } = useContext(CurrentItemContext);
  const { optimisticUpdateItems } = useCache();

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
        slug: loadedItem.item.slug,
        metadata: { readingProgress, lastReadAt: new Date().toISOString() },
      },
    ]);
    return await updateReadingProgressMutation.mutateAsync({
      slug: loadedItem.item.slug,
      readingProgress,
    });
  };

  return {
    updateReadingProgress,
  };
};
