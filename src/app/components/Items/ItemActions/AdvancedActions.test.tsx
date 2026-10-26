import AdvancedActions from "@app/components/Items/ItemActions/AdvancedActions";
import { type Item } from "@app/providers/Items";
import { ToastProvider } from "@app/providers/Toast/provider";
import { ItemSource, ItemState, TextDirection } from "@app/schemas/db";
import { act, fireEvent, render, RenderResult, screen } from "@app/utils/test";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockMarkRead = vi.fn();
const mockMarkUnread = vi.fn();
const mockRefetchItem = vi.fn();
const mockDownloadArticleOffline = vi.fn();
const mockRemoveArticleOffline = vi.fn();
let mockIsSavedOffline = false;

vi.mock("@app/components/Items/ItemActions/actions", () => ({
  useItemUpdate: () => ({
    markRead: mockMarkRead,
    markUnread: mockMarkUnread,
    refetchItem: mockRefetchItem,
  }),
}));

vi.mock("@app/components/Items/useOfflineArticle", () => ({
  useOfflineArticle: () => ({
    isSavedOffline: mockIsSavedOffline,
    downloadArticleOffline: mockDownloadArticleOffline,
    removeArticleOffline: mockRemoveArticleOffline,
  }),
}));

describe("AdvancedActions component", () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsSavedOffline = false;
  });

  const renderComponent = (item: Item = mockItem): RenderResult =>
    render(
      <ToastProvider>
        <AdvancedActions item={item} />
      </ToastProvider>,
    );

  it("renders 3 dots button and shows 'Read offline' when item is not saved offline", async () => {
    mockIsSavedOffline = false;
    renderComponent();

    const button = screen.getByRole("button", { name: /more actions/i });
    expect(button).toBeInTheDocument();

    act(() => {
      fireEvent.click(button);
    });

    const readOfflineItem = await screen.findByText("Read offline");
    expect(readOfflineItem).toBeInTheDocument();

    act(() => {
      fireEvent.click(readOfflineItem);
    });

    expect(mockDownloadArticleOffline).toHaveBeenCalledWith("article-slug");
  });

  it("shows 'Remove from offline' when item is already saved offline", async () => {
    mockIsSavedOffline = true;
    renderComponent();

    const button = screen.getByRole("button", { name: /more actions/i });
    act(() => {
      fireEvent.click(button);
    });

    const removeOfflineItem = await screen.findByText("Remove from offline");
    expect(removeOfflineItem).toBeInTheDocument();

    act(() => {
      fireEvent.click(removeOfflineItem);
    });

    expect(mockRemoveArticleOffline).toHaveBeenCalledWith("article-slug");
  });
});
