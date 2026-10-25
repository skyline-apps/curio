import { useOfflineArticle } from "@app/components/Items/useOfflineArticle";
import {
  ITEM_CONTENT_QUERY_KEY,
  type ItemWithContent,
} from "@app/providers/CurrentItem";
import { ToastContext } from "@app/providers/Toast";
import { ItemSource, ItemState, TextDirection } from "@app/schemas/db";
import { OfflineError } from "@app/utils/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockShowToast = vi.fn();

vi.mock("@app/utils/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@app/utils/api")>();
  return {
    ...actual,
    authenticatedFetch: vi.fn(),
  };
});

describe("useOfflineArticle hook", () => {
  let queryClient: QueryClient;

  const mockItemData: ItemWithContent = {
    item: {
      id: "offline-item-id",
      profileItemId: "offline-profile-id",
      slug: "offline-slug",
      url: "https://example.com/offline",
      createdAt: new Date().toISOString(),
      excerpt: "Sample excerpt",
      labels: [],
      metadata: {
        title: "Offline Article",
        description: "Offline Description",
        source: ItemSource.EMAIL,
        thumbnail: null,
        favicon: "",
        textDirection: TextDirection.LTR,
        textLanguage: "en",
        state: ItemState.ACTIVE,
        isFavorite: false,
        lastReadAt: null,
        readingProgress: 0,
        versionName: null,
      },
    },
    content: "# Offline Content\nThis is cached content.",
  };

  const wrapper = ({
    children,
  }: {
    children: React.ReactNode;
  }): React.ReactElement => (
    <QueryClientProvider client={queryClient}>
      <ToastContext.Provider
        value={{ showToast: mockShowToast, hideToast: vi.fn() }}
      >
        {children}
      </ToastContext.Provider>
    </QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: Infinity,
        },
      },
    });
  });

  it("returns isSavedOffline = false when no content is cached", () => {
    const { result } = renderHook(() => useOfflineArticle("offline-slug"), {
      wrapper,
    });

    expect(result.current.isSavedOffline).toBe(false);
  });

  it("returns isSavedOffline = true when content exists in query cache", () => {
    queryClient.setQueryData(
      [ITEM_CONTENT_QUERY_KEY, "offline-slug"],
      mockItemData,
    );

    const { result } = renderHook(() => useOfflineArticle("offline-slug"), {
      wrapper,
    });

    expect(result.current.isSavedOffline).toBe(true);
  });

  it("downloads article, populates query cache, and shows success toast", async () => {
    const { authenticatedFetch } = await import("@app/utils/api");
    vi.mocked(authenticatedFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockItemData,
    } as unknown as Response);

    const { result } = renderHook(() => useOfflineArticle("offline-slug"), {
      wrapper,
    });

    let success = false;
    await act(async () => {
      success = await result.current.downloadArticleOffline();
    });

    expect(success).toBe(true);
    expect(mockShowToast).toHaveBeenCalledWith("Saved for offline reading.", {
      disappearing: true,
    });

    const cachedData = queryClient.getQueryData<ItemWithContent>([
      ITEM_CONTENT_QUERY_KEY,
      "offline-slug",
    ]);
    expect(cachedData?.content).toBe(mockItemData.content);
    expect(result.current.isSavedOffline).toBe(true);
  });

  it("removes article from query cache and shows removal toast", () => {
    queryClient.setQueryData(
      [ITEM_CONTENT_QUERY_KEY, "offline-slug"],
      mockItemData,
    );

    const { result } = renderHook(() => useOfflineArticle("offline-slug"), {
      wrapper,
    });

    expect(result.current.isSavedOffline).toBe(true);

    act(() => {
      result.current.removeArticleOffline();
    });

    expect(mockShowToast).toHaveBeenCalledWith(
      "Removed from offline storage.",
      { disappearing: true },
    );

    const cachedData = queryClient.getQueryData<ItemWithContent>([
      ITEM_CONTENT_QUERY_KEY,
      "offline-slug",
    ]);
    expect(cachedData).toBeUndefined();
    expect(result.current.isSavedOffline).toBe(false);
  });

  it("shows offline error toast when download fails due to being offline", async () => {
    const { authenticatedFetch } = await import("@app/utils/api");
    vi.mocked(authenticatedFetch).mockRejectedValueOnce(
      new OfflineError("It looks like you're offline..."),
    );

    const { result } = renderHook(() => useOfflineArticle("offline-slug"), {
      wrapper,
    });

    let success = true;
    await act(async () => {
      success = await result.current.downloadArticleOffline();
    });

    expect(success).toBe(false);
    expect(mockShowToast).toHaveBeenCalledWith(
      "Cannot download article while offline.",
      { type: "error" },
    );
  });

  it("shows generic error toast when download fails with unexpected error", async () => {
    const { authenticatedFetch } = await import("@app/utils/api");
    vi.mocked(authenticatedFetch).mockRejectedValueOnce(
      new Error("Server error 500"),
    );

    const { result } = renderHook(() => useOfflineArticle("offline-slug"), {
      wrapper,
    });

    let success = true;
    await act(async () => {
      success = await result.current.downloadArticleOffline();
    });

    expect(success).toBe(false);
    expect(mockShowToast).toHaveBeenCalledWith(
      "Failed to download article for offline reading.",
      { type: "error" },
    );
  });
});
