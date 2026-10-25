import {
  ITEM_CONTENT_QUERY_KEY,
  type ItemWithContent,
} from "@app/providers/CurrentItem";
import { useToast } from "@app/providers/Toast";
import { GetItemContentResponse } from "@app/schemas/v1/public/items/content";
import {
  authenticatedFetch,
  handleAPIResponse,
  isOfflineError,
} from "@app/utils/api";
import { createLogger } from "@app/utils/logger";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useSyncExternalStore } from "react";

const log = createLogger("offline-article");

export const fetchItemContent = async (
  slug: string,
): Promise<ItemWithContent> => {
  const searchParams = new URLSearchParams({
    slug,
  });
  const result = await authenticatedFetch(
    `/api/v1/public/items/content?${searchParams.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  ).then(handleAPIResponse<GetItemContentResponse>);

  if (!result || "error" in result) {
    throw new Error(
      result && "error" in result && typeof result.error === "string"
        ? result.error
        : "Failed to fetch item content",
    );
  }
  return result;
};

export interface UseOfflineArticleReturn {
  isSavedOffline: boolean;
  downloadArticleOffline: (itemSlug?: string) => Promise<boolean>;
  removeArticleOffline: (itemSlug?: string) => void;
}

export function useOfflineArticle(slug?: string): UseOfflineArticleReturn {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const isSavedOffline = useSyncExternalStore(
    (onStoreChange) => {
      return queryClient.getQueryCache().subscribe((event) => {
        if (
          event.query.queryKey[0] === ITEM_CONTENT_QUERY_KEY &&
          (!slug || event.query.queryKey[1] === slug)
        ) {
          onStoreChange();
        }
      });
    },
    () => {
      if (!slug) return false;
      const data = queryClient.getQueryData<ItemWithContent>([
        ITEM_CONTENT_QUERY_KEY,
        slug,
      ]);
      return Boolean(data?.content);
    },
    () => false,
  );

  const downloadArticleOffline = useCallback(
    async (itemSlug?: string): Promise<boolean> => {
      const targetSlug = itemSlug || slug;
      if (!targetSlug) return false;

      try {
        await queryClient.fetchQuery({
          queryKey: [ITEM_CONTENT_QUERY_KEY, targetSlug],
          queryFn: () => fetchItemContent(targetSlug),
          staleTime: 30 * 60 * 1000,
        });
        showToast("Saved for offline reading.", { disappearing: true });
        return true;
      } catch (error) {
        log.error("Failed to download article for offline:", error);
        if (isOfflineError(error)) {
          showToast("Cannot download article while offline.", {
            type: "error",
          });
        } else {
          showToast("Failed to download article for offline reading.", {
            type: "error",
          });
        }
        return false;
      }
    },
    [queryClient, slug, showToast],
  );

  const removeArticleOffline = useCallback(
    (itemSlug?: string): void => {
      const targetSlug = itemSlug || slug;
      if (!targetSlug) return;

      queryClient.removeQueries({
        queryKey: [ITEM_CONTENT_QUERY_KEY, targetSlug],
      });
      showToast("Removed from offline storage.", { disappearing: true });
    },
    [queryClient, slug, showToast],
  );

  return {
    isSavedOffline,
    downloadArticleOffline,
    removeArticleOffline,
  };
}
