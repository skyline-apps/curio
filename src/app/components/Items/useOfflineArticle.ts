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
  OfflineError,
} from "@app/utils/api";
import { createLogger } from "@app/utils/logger";
import { onlineManager, useQueryClient } from "@tanstack/react-query";
import { useCallback, useSyncExternalStore } from "react";

const log = createLogger("offline-article");

export function useIsOnline(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const unsub = onlineManager.subscribe(onStoreChange);
      if (typeof window !== "undefined") {
        window.addEventListener("online", onStoreChange);
        window.addEventListener("offline", onStoreChange);
      }
      return () => {
        unsub();
        if (typeof window !== "undefined") {
          window.removeEventListener("online", onStoreChange);
          window.removeEventListener("offline", onStoreChange);
        }
      };
    },
    () => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        return false;
      }
      return onlineManager.isOnline();
    },
    () => true,
  );
}

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

  if (!result || "error" in result || !result.content) {
    throw new Error(
      result && "error" in result && typeof result.error === "string"
        ? result.error
        : !result?.content
          ? "Article content is unavailable"
          : "Failed to fetch item content",
    );
  }
  return result;
};

export interface UseOfflineArticleReturn {
  isSavedOffline: boolean;
  isOnline: boolean;
  isUnavailableOffline: boolean;
  downloadArticleOffline: (itemSlug?: string) => Promise<boolean>;
  removeArticleOffline: (itemSlug?: string) => void;
}

export function useOfflineArticle(slug?: string): UseOfflineArticleReturn {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const isOnline = useIsOnline();

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

  const isUnavailableOffline = !isOnline && !isSavedOffline;

  const downloadArticleOffline = useCallback(
    async (itemSlug?: string): Promise<boolean> => {
      const targetSlug = itemSlug || slug;
      if (!targetSlug) return false;

      if (!isOnline) {
        showToast("Cannot download article while offline.", {
          type: "error",
        });
        throw new OfflineError("Cannot download article while offline.");
      }

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
          showToast(
            error instanceof Error && error.message
              ? error.message
              : "Failed to download article for offline reading.",
            {
              type: "error",
            },
          );
        }
        throw error;
      }
    },
    [queryClient, slug, showToast, isOnline],
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
    isOnline,
    isUnavailableOffline,
    downloadArticleOffline,
    removeArticleOffline,
  };
}
