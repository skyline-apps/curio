import { useCache } from "@app/providers/Cache";
import { CurrentItemContext } from "@app/providers/CurrentItem";
import { useToast } from "@app/providers/Toast";
import {
  CreateOrUpdateHighlightResponse,
  DeleteHighlightResponse,
  type Highlight,
  type NewHighlight,
} from "@app/schemas/v1/items/highlights";
import { authenticatedFetch, handleAPIResponse } from "@app/utils/api";
import { createLogger } from "@app/utils/logger";
import { executeOrQueueOfflineAction } from "@app/utils/offlineQueue";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { useContext, useState } from "react";

const log = createLogger("right-sidebar-actions");

export const isHighlightWithId = (
  highlight: Highlight | NewHighlight | null,
): highlight is Highlight => !!highlight && "id" in highlight;

interface UseHighlightUpdate {
  createHighlight: (
    highlight: NewHighlight,
  ) => Promise<CreateOrUpdateHighlightResponse>;
  updateHighlightNote: (
    note: string,
  ) => Promise<CreateOrUpdateHighlightResponse>;
  deleteHighlight: () => Promise<DeleteHighlightResponse>;
  isUpdating: boolean;
  isDeleting: boolean;
}

interface UseHighlightUpdateProps {
  currentHighlight: Highlight | null;
  itemSlug: string;
  onUpdate?: (highlight: Highlight | null) => void;
}

export const useHighlightUpdate = ({
  currentHighlight,
  itemSlug,
  onUpdate,
}: UseHighlightUpdateProps): UseHighlightUpdate => {
  const { loadedItem } = useContext(CurrentItemContext);
  const { showToast } = useToast();
  const {
    invalidateCache,
    optimisticUpdateHighlights,
    optimisticRemoveHighlights,
    optimisticUpdateItems,
  } = useCache();
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const createOrUpdateHighlightMutationOptions: UseMutationOptions<
    CreateOrUpdateHighlightResponse,
    Error,
    { slug: string; highlight: NewHighlight | Highlight }
  > = {
    networkMode: "always",
    mutationFn: async ({ slug, highlight }) => {
      setIsUpdating(true);

      const highlightId =
        highlight.id ||
        (typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}`);
      const highlightWithId: Highlight = {
        ...highlight,
        id: highlightId,
      };

      return await executeOrQueueOfflineAction({
        action: {
          type: "create_or_update_highlight",
          endpoint: "/api/v1/items/highlights",
          method: "POST",
          body: {
            slug,
            highlights: [highlightWithId],
          },
          entityKey: `highlight:${slug}:${highlightId}`,
        },
        executeOnline: async () => {
          return await authenticatedFetch("/api/v1/items/highlights", {
            method: "POST",
            body: JSON.stringify({
              slug,
              highlights: [highlightWithId],
            }),
          }).then(handleAPIResponse<CreateOrUpdateHighlightResponse>);
        },
        fallbackOffline: () => ({
          highlights: [highlightWithId],
        }),
        onQueued: () => {
          showToast("Saved offline. Will sync when reconnected.");
        },
      });
    },
    onSuccess: (data) => {
      optimisticUpdateHighlights(data.highlights);
      if (
        loadedItem?.item &&
        "highlights" in loadedItem.item &&
        data.highlights.length === 1
      ) {
        onUpdate?.(data.highlights[0]);
        optimisticUpdateItems([
          {
            slug: itemSlug,
            highlights: [
              ...(loadedItem.item?.highlights?.filter(
                (h: Highlight) => !data.highlights.some((dh) => dh.id === h.id),
              ) || []),
              ...data.highlights,
            ],
          },
        ]);
      } else {
        if (typeof navigator === "undefined" || navigator.onLine) {
          invalidateCache(itemSlug);
        }
      }
    },
    onError: () => {
      showToast("Failed to update highlight.");
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
    networkMode: "always",
    mutationFn: async ({ slug, highlightId }) => {
      setIsDeleting(true);

      return await executeOrQueueOfflineAction({
        action: {
          type: "delete_highlight",
          endpoint: "/api/v1/items/highlights",
          method: "DELETE",
          body: {
            slug,
            highlightIds: [highlightId],
          },
          entityKey: `highlight:${slug}:${highlightId}`,
        },
        executeOnline: async () => {
          return await authenticatedFetch("/api/v1/items/highlights", {
            method: "DELETE",
            body: JSON.stringify({
              slug,
              highlightIds: [highlightId],
            }),
          }).then(handleAPIResponse<DeleteHighlightResponse>);
        },
        fallbackOffline: () => ({
          deleted: [{ id: highlightId }],
        }),
        onQueued: () => {
          showToast("Saved offline. Will sync when reconnected.");
        },
      });
    },
    onSuccess: (data) => {
      optimisticRemoveHighlights(data.deleted.map((d) => d.id));
      if (loadedItem?.item && "highlights" in loadedItem.item) {
        onUpdate?.(null);
        optimisticUpdateItems([
          {
            slug: itemSlug,
            highlights:
              loadedItem.item?.highlights?.filter(
                (h: Highlight) => !data.deleted.some((d) => d.id === h.id),
              ) || [],
          },
        ]);
      } else {
        if (typeof navigator === "undefined" || navigator.onLine) {
          invalidateCache(itemSlug);
        }
      }
    },
    onError: () => {
      showToast("Failed to delete highlight.");
    },
    onSettled: () => {
      setIsDeleting(false);
    },
  };

  const deleteHighlightMutation = useMutation(deleteHighlightMutationOptions);

  const createHighlight = async (
    highlight: NewHighlight,
  ): Promise<CreateOrUpdateHighlightResponse> => {
    if (!itemSlug) {
      log.error("Failed to create highlight, item not loaded");
      throw new Error("Item not loaded");
    }
    return await createOrUpdateHighlightMutation.mutateAsync({
      slug: itemSlug,
      highlight,
    });
  };

  const updateHighlightNote = async (
    note: string,
  ): Promise<CreateOrUpdateHighlightResponse> => {
    if (!itemSlug || !currentHighlight) {
      log.error("Failed to create highlight, highlight not loaded");
      throw new Error("Highlight not loaded");
    }
    return await createOrUpdateHighlightMutation.mutateAsync({
      slug: itemSlug,
      highlight: {
        ...currentHighlight,
        note,
      },
    });
  };

  const deleteHighlight = async (): Promise<DeleteHighlightResponse> => {
    if (
      !itemSlug ||
      !currentHighlight ||
      !isHighlightWithId(currentHighlight)
    ) {
      log.error("Failed to delete highlight, highlight not loaded");
      throw new Error("Highlight not loaded");
    }
    return await deleteHighlightMutation.mutateAsync({
      slug: itemSlug,
      highlightId: currentHighlight.id,
    });
  };

  return {
    createHighlight,
    updateHighlightNote,
    deleteHighlight,
    isUpdating,
    isDeleting,
  };
};
