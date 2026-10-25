import ItemActions from "@app/components/Items/ItemActions";
import { type Item } from "@app/providers/Items";
import { ToastProvider } from "@app/providers/Toast/provider";
import { ItemSource, ItemState, TextDirection } from "@app/schemas/db";
import { act, fireEvent, render, RenderResult, screen } from "@app/utils/test";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUpdateItemsState = vi.fn();
const mockUpdateItemsFavorite = vi.fn();
const mockShareItem = vi.fn();
const mockDownloadArticleOffline = vi.fn();
const mockRemoveArticleOffline = vi.fn();
let mockIsSavedOffline = false;

vi.mock("@app/components/Items/ItemActions/actions", () => ({
  useItemUpdate: () => ({
    updateItemsState: mockUpdateItemsState,
    updateItemsFavorite: mockUpdateItemsFavorite,
    shareItem: mockShareItem,
  }),
}));

vi.mock("@app/components/Items/useOfflineArticle", () => ({
  useOfflineArticle: () => ({
    isSavedOffline: mockIsSavedOffline,
    isOnline: true,
    isUnavailableOffline: false,
    downloadArticleOffline: mockDownloadArticleOffline,
    removeArticleOffline: mockRemoveArticleOffline,
  }),
}));

describe("ItemActions component", () => {
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

  const renderComponent = (item?: Item, showExpanded = false): RenderResult =>
    render(
      <ToastProvider>
        <ItemActions item={item} showExpanded={showExpanded} />
      </ToastProvider>,
    );

  it("renders empty when item is undefined", () => {
    const { container } = renderComponent(undefined);
    expect(container.firstChild).toBeEmptyDOMElement();
  });

  it("renders read offline button and calls downloadArticleOffline on click when not saved", async () => {
    mockIsSavedOffline = false;
    renderComponent(mockItem);

    const readOfflineButton = screen.getByTestId("item-action-read-offline");
    expect(readOfflineButton).toBeInTheDocument();
    expect(readOfflineButton).toHaveAttribute("aria-label", "Read offline");
    expect(readOfflineButton).not.toHaveAttribute("data-active");

    await act(async () => {
      fireEvent.click(readOfflineButton);
    });

    expect(mockDownloadArticleOffline).toHaveBeenCalledWith("article-slug");
  });

  it("renders remove from offline button and calls removeArticleOffline on click when saved", async () => {
    mockIsSavedOffline = true;
    renderComponent(mockItem);

    const removeOfflineButton = screen.getByTestId("item-action-read-offline");
    expect(removeOfflineButton).toBeInTheDocument();
    expect(removeOfflineButton).toHaveAttribute(
      "aria-label",
      "Remove from offline",
    );
    expect(removeOfflineButton).toHaveAttribute("data-active", "true");
    expect(removeOfflineButton).toHaveClass("text-primary");

    await act(async () => {
      fireEvent.click(removeOfflineButton);
    });

    expect(mockRemoveArticleOffline).toHaveBeenCalledWith("article-slug");
  });

  it("renders favorite and archive buttons alongside read offline", async () => {
    renderComponent(mockItem);

    const favoriteButton = screen.getByTestId("item-action-favorite");
    const archiveButton = screen.getByTestId("item-action-archive");
    const readOfflineButton = screen.getByTestId("item-action-read-offline");

    expect(favoriteButton).toBeInTheDocument();
    expect(archiveButton).toBeInTheDocument();
    expect(readOfflineButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(favoriteButton);
    });
    expect(mockUpdateItemsFavorite).toHaveBeenCalledWith(
      ["article-slug"],
      true,
    );

    await act(async () => {
      fireEvent.click(archiveButton);
    });
    expect(mockUpdateItemsState).toHaveBeenCalledWith(
      ["article-slug"],
      ItemState.ARCHIVED,
    );
  });

  it("renders delete and share buttons when showExpanded is true and omits read offline", () => {
    renderComponent(mockItem, true);

    expect(screen.getByTestId("item-action-delete")).toBeInTheDocument();
    expect(screen.getByTestId("item-action-share")).toBeInTheDocument();
    expect(
      screen.queryByTestId("item-action-read-offline"),
    ).not.toBeInTheDocument();
  });
});
