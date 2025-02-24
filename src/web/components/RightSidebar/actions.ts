"use client";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { useContext, useState } from "react";

import {
  CreateOrUpdateHighlightResponse,
  DeleteHighlightResponse,
  type Highlight,
  type NewHighlight,
} from "@/app/api/v1/items/highlights/validation";
import { useCache } from "@/providers/CacheProvider";
import { CurrentItemContext } from "@/providers/CurrentItemProvider";
import { handleAPIResponse } from "@/utils/api";
import { createLogger } from "@/utils/logger";

const log = createLogger("right-sidebar-actions");

export const isHighlightWithId = (
  highlight: Highlight | NewHighlight | null,
): highlight is Highlight => !!highlight && "id" in highlight;

interface UseRightSidebarUpdate {
  createOrUpdateHighlight: () => Promise<CreateOrUpdateHighlightResponse>;
  deleteHighlight: () => Promise<DeleteHighlightResponse>;
  isUpdating: boolean;
  isDeleting: boolean;
}

export const useRightSidebarUpdate = (): UseRightSidebarUpdate => {
  const { draftHighlight, loadedItem, setDraftHighlight } =
    useContext(CurrentItemContext);
  const { optimisticUpdateItems } = useCache();
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const createOrUpdateHighlightMutationOptions: UseMutationOptions<
    CreateOrUpdateHighlightResponse,
    Error,
    { slug: string; highlight: NewHighlight | Highlight }
  > = {
    mutationFn: async ({ slug, highlight }) => {
      setIsUpdating(true);
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
        setDraftHighlight(null);
        optimisticUpdateItems([
          {
            slug: loadedItem.item.slug,
            highlights: [
              ...(loadedItem.item.highlights?.filter(
                (h) => !data.highlights.some((dh) => dh.id === h.id),
              ) || []),
              ...data.highlights,
            ],
          },
        ]);
      }
    },
    onSettled: () => {
      setIsUpdating(false);
    },
  };

  const createOrUpdateHighlightMutation = useMutation(
    createOrUpdateHighlightMutationOptions,
  );

  const deleteHighlightMutationOptions: UseMutationOptions<
    DeleteHighlightResponse,
    Error,
    { slug: string; highlightId: string }
  > = {
    mutationFn: async ({ slug, highlightId }) => {
      setIsDeleting(true);
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
        setDraftHighlight(null);
        optimisticUpdateItems([
          {
            slug: loadedItem.item.slug,
            highlights:
              loadedItem.item.highlights?.filter(
                (h) => !data.deleted.some((d) => d.id === h.id),
              ) || [],
          },
        ]);
      }
    },
    onSettled: () => {
      setIsDeleting(false);
    },
  };

  const deleteHighlightMutation = useMutation(deleteHighlightMutationOptions);

  const createOrUpdateHighlight =
    async (): Promise<CreateOrUpdateHighlightResponse> => {
      if (!loadedItem?.item || !draftHighlight) {
        log.error("Failed to create highlight, highlight not loaded");
        throw new Error("Highlight not loaded");
      }
      return await createOrUpdateHighlightMutation.mutateAsync({
        slug: loadedItem.item.slug,
        highlight: draftHighlight,
      });
    };

  const deleteHighlight = async (): Promise<DeleteHighlightResponse> => {
    if (!loadedItem?.item || !isHighlightWithId(draftHighlight)) {
      log.error("Failed to delete highlight, highlight not loaded");
      throw new Error("Highlight not loaded");
    }
    return await deleteHighlightMutation.mutateAsync({
      slug: loadedItem.item.slug,
      highlightId: draftHighlight.id,
    });
  };

  return {
    createOrUpdateHighlight,
    deleteHighlight,
    isUpdating,
    isDeleting,
  };
};
