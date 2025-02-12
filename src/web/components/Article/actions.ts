"use client";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { useContext } from "react";

import {
  CreateOrUpdateHighlightResponse,
  DeleteHighlightResponse,
  NewHighlight,
} from "@/app/api/v1/items/highlights/validation";
import { ReadItemResponse } from "@/app/api/v1/items/read/validation";
import { useCache } from "@/providers/CacheProvider";
import { CurrentItemContext } from "@/providers/CurrentItemProvider";
import { handleAPIResponse } from "@/utils/api";
import { createLogger } from "@/utils/logger";

const log = createLogger("article-actions");

interface UseArticleUpdate {
  updateReadingProgress: (readingProgress: number) => Promise<ReadItemResponse>;
  createHighlight: (
    highlight: NewHighlight,
  ) => Promise<CreateOrUpdateHighlightResponse>;
  deleteHighlight: (highlightId: string) => Promise<DeleteHighlightResponse>;
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

  const createHighlightMutationOptions: UseMutationOptions<
    CreateOrUpdateHighlightResponse,
    Error,
    { slug: string; highlight: NewHighlight }
  > = {
    mutationFn: async ({ slug, highlight }) => {
      return await fetch("/api/v1/items/highlights", {
        method: "POST",
        body: JSON.stringify({
          slug,
          highlights: [highlight],
        }),
      }).then(handleAPIResponse<CreateOrUpdateHighlightResponse>);
    },
    onSuccess: (data) => {
      if (loadedItem?.item) {
        optimisticUpdateItems([
          {
            slug: loadedItem.item.slug,
            highlights: [
              ...(loadedItem.item.highlights || []),
              ...data.highlights,
            ],
          },
        ]);
      }
    },
  };

  const createHighlightMutation = useMutation(createHighlightMutationOptions);

  const deleteHighlightMutationOptions: UseMutationOptions<
    DeleteHighlightResponse,
    Error,
    { slug: string; highlightId: string }
  > = {
    mutationFn: async ({ slug, highlightId }) => {
      return await fetch("/api/v1/items/highlights", {
        method: "DELETE",
        body: JSON.stringify({
          slug,
          highlightIds: [highlightId],
        }),
      }).then(handleAPIResponse<DeleteHighlightResponse>);
    },
    onSuccess: (data) => {
      if (loadedItem?.item) {
        optimisticUpdateItems([
          {
            slug: loadedItem.item.slug,
            highlights: loadedItem.item.highlights.filter(
              (h) => !data.deleted.some((d) => d.id === h.id),
            ),
          },
        ]);
      }
    },
  };

  const deleteHighlightMutation = useMutation(deleteHighlightMutationOptions);

  const createHighlight = async (
    highlight: NewHighlight,
  ): Promise<CreateOrUpdateHighlightResponse> => {
    if (!loadedItem?.item) {
      log.error("Failed to create highlight, item not loaded");
      throw new Error("Item not loaded");
    }
    return await createHighlightMutation.mutateAsync({
      slug: loadedItem.item.slug,
      highlight,
    });
  };

  const deleteHighlight = async (
    highlightId: string,
  ): Promise<DeleteHighlightResponse> => {
    if (!loadedItem?.item) {
      log.error("Failed to delete highlight, item not loaded");
      throw new Error("Item not loaded");
    }
    return await deleteHighlightMutation.mutateAsync({
      slug: loadedItem.item.slug,
      highlightId,
    });
  };

  return {
    updateReadingProgress,
    createHighlight,
    deleteHighlight,
  };
};
