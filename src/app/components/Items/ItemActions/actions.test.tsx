import { useItemUpdate } from "@app/components/Items/ItemActions/actions";
import { BrowserMessageProvider } from "@app/providers/BrowserMessage/provider";
import { CacheProvider } from "@app/providers/Cache/provider";
import { CurrentItemProvider } from "@app/providers/CurrentItem/provider";
import {
  type Item,
  ITEMS_QUERY_KEY,
  type ItemsPage,
} from "@app/providers/Items";
import { ItemsProvider } from "@app/providers/Items/provider";
import { SettingsProvider } from "@app/providers/Settings/provider";
import { ToastProvider } from "@app/providers/Toast/provider";
import { UserProvider } from "@app/providers/User/provider";
import { ItemSource, ItemState, TextDirection } from "@app/schemas/db";
import { OfflineError } from "@app/utils/api";
import { clearOfflineQueue, getOfflineQueue } from "@app/utils/offlineQueue";
import { act, renderHook } from "@app/utils/test";
import { AllProviders } from "@app/utils/test/component";
import {
  InfiniteData,
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockAuthenticatedFetch = vi.fn();
const mockShowToast = vi.fn();

vi.mock("@app/utils/api", async () => {
  const actual = await vi.importActual("@app/utils/api");
  return {
    ...actual,
    authenticatedFetch: (...args: unknown[]) => mockAuthenticatedFetch(...args),
  };
});

vi.mock("@app/providers/Toast", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@app/providers/Toast")>();
  return {
    ...actual,
    useToast: () => ({
      showToast: mockShowToast,
      hideToast: vi.fn(),
    }),
  };
});

describe("useItemUpdate offline actions", () => {
  const mockItem: Item = {
    id: "item-1",
    profileItemId: "profile-1",
    slug: "article-slug",
    url: "https://example.com/story",
    createdAt: new Date().toISOString(),
    excerpt: "Story excerpt",
    labels: [],
    metadata: {
      title: "Story Title",
      description: "Story Description",
      source: ItemSource.OMNIVORE,
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
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockAuthenticatedFetch.mockImplementation(async () => ({
      ok: true,
      json: async () => ({ updated: [] }),
      text: async () => "{}",
    }));
    await clearOfflineQueue();
    onlineManager.setOnline(true);
    Object.defineProperty(navigator, "onLine", {
      value: true,
      configurable: true,
    });
  });

  afterEach(async () => {
    await clearOfflineQueue();
  });

  it("updates item state online and executes API call", async () => {
    mockAuthenticatedFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ updated: [{ slug: "article-slug" }] }),
    });

    const { result } = renderHook(() => useItemUpdate(), {
      wrapper: AllProviders,
    });

    await act(async () => {
      await result.current.updateItemsState(
        ["article-slug"],
        ItemState.ARCHIVED,
      );
    });

    expect(mockAuthenticatedFetch).toHaveBeenCalledWith("/api/v1/items/state", {
      method: "POST",
      body: JSON.stringify({
        slugs: "article-slug",
        state: ItemState.ARCHIVED,
      }),
    });

    const queue = await getOfflineQueue();
    expect(queue).toHaveLength(0);
  });

  it("queues state update when device is offline and displays offline toast", async () => {
    Object.defineProperty(navigator, "onLine", {
      value: false,
      configurable: true,
    });
    onlineManager.setOnline(false);

    const { result } = renderHook(() => useItemUpdate(), {
      wrapper: AllProviders,
    });

    await act(async () => {
      await result.current.updateItemsState(
        ["article-slug"],
        ItemState.ARCHIVED,
      );
    });

    expect(mockAuthenticatedFetch).not.toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith(
      "Saved offline. Will sync when reconnected.",
    );

    const queue = await getOfflineQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].type).toBe("update_item_state");
    expect(queue[0].body).toEqual({
      slugs: "article-slug",
      state: ItemState.ARCHIVED,
    });
  });

  it("queues favorite update when online call throws OfflineError", async () => {
    mockAuthenticatedFetch.mockImplementation(async (url: unknown) => {
      if (typeof url === "string" && url.includes("/api/v1/items/favorite")) {
        throw new OfflineError("It looks like you're offline...");
      }
      return {
        ok: true,
        json: async () => ({ updated: [] }),
        text: async () => "{}",
      };
    });

    const { result } = renderHook(() => useItemUpdate(), {
      wrapper: AllProviders,
    });

    await act(async () => {
      await result.current.updateItemsFavorite(["article-slug"], true);
    });

    expect(mockShowToast).toHaveBeenCalledWith(
      "Saved offline. Will sync when reconnected.",
    );

    const queue = await getOfflineQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].type).toBe("update_item_favorite");
    expect(queue[0].body).toEqual({
      slugs: "article-slug",
      favorite: true,
    });
  });

  it("queues markRead and markUnread when offline", async () => {
    Object.defineProperty(navigator, "onLine", {
      value: false,
      configurable: true,
    });
    onlineManager.setOnline(false);

    const { result } = renderHook(() => useItemUpdate(), {
      wrapper: AllProviders,
    });

    await act(async () => {
      await result.current.markRead(mockItem);
    });

    let queue = await getOfflineQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].type).toBe("mark_item_read");
    expect(queue[0].body).toEqual({
      slug: "article-slug",
      readingProgress: 0,
    });

    await act(async () => {
      await result.current.markUnread(mockItem);
    });

    queue = await getOfflineQueue();
    // Coalesced under same entityKey read:article-slug
    expect(queue).toHaveLength(1);
    expect(queue[0].type).toBe("mark_item_unread");
    expect(queue[0].method).toBe("DELETE");
  });

  it("queues label additions and removals when offline", async () => {
    Object.defineProperty(navigator, "onLine", {
      value: false,
      configurable: true,
    });
    onlineManager.setOnline(false);

    const { result } = renderHook(() => useItemUpdate(), {
      wrapper: AllProviders,
    });

    const testLabel1 = { id: "label-1", name: "Tech", color: "#fff" };
    const testLabel2 = { id: "label-2", name: "News", color: "#000" };

    await act(async () => {
      await result.current.addItemsLabel([mockItem], testLabel1);
    });

    let queue = await getOfflineQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].type).toBe("add_item_label");
    expect(queue[0].body).toEqual({
      slugs: "article-slug",
      labelIds: ["label-1"],
    });

    await act(async () => {
      await result.current.removeItemsLabel([mockItem], testLabel2);
    });

    queue = await getOfflineQueue();
    expect(queue).toHaveLength(2);
    expect(queue[1].type).toBe("remove_item_label");
    expect(queue[1].method).toBe("DELETE");
  });

  it("optimistically moves item to archive query cache when archiving offline", async () => {
    Object.defineProperty(navigator, "onLine", {
      value: false,
      configurable: true,
    });
    onlineManager.setOnline(false);

    const testClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    const activeKey = [
      ITEMS_QUERY_KEY,
      JSON.stringify({ filters: { state: "active" } }),
    ];
    const archiveKey = [
      ITEMS_QUERY_KEY,
      JSON.stringify({ filters: { state: "archived" } }),
    ];

    testClient.setQueryData<InfiniteData<ItemsPage>>(activeKey, {
      pageParams: [undefined],
      pages: [
        {
          items: [mockItem],
          total: 1,
        },
      ],
    });

    const customWrapper = ({
      children,
    }: {
      children: React.ReactNode;
    }): React.ReactElement => (
      <QueryClientProvider client={testClient}>
        <UserProvider>
          <SettingsProvider>
            <ToastProvider>
              <ItemsProvider>
                <CurrentItemProvider>
                  <CacheProvider>
                    <BrowserMessageProvider>{children}</BrowserMessageProvider>
                  </CacheProvider>
                </CurrentItemProvider>
              </ItemsProvider>
            </ToastProvider>
          </SettingsProvider>
        </UserProvider>
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useItemUpdate(), {
      wrapper: customWrapper,
    });

    await act(async () => {
      await result.current.updateItemsState(
        ["article-slug"],
        ItemState.ARCHIVED,
      );
    });

    // Check that it was removed from active query
    const activeData =
      testClient.getQueryData<InfiniteData<ItemsPage>>(activeKey);
    expect(activeData?.pages[0].items).toHaveLength(0);

    // Check that it was added to archive query with ARCHIVED state
    const archiveData =
      testClient.getQueryData<InfiniteData<ItemsPage>>(archiveKey);
    expect(archiveData?.pages[0].items).toHaveLength(1);
    expect(archiveData?.pages[0].items[0].slug).toBe("article-slug");
    expect(archiveData?.pages[0].items[0].metadata.state).toBe(
      ItemState.ARCHIVED,
    );

    // Also verify queued offline action
    const queue = await getOfflineQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].type).toBe("update_item_state");
  });
});
