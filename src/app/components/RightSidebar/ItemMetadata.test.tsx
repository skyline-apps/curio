import ItemMetadata from "@app/components/RightSidebar/ItemMetadata";
import { type Item } from "@app/providers/Items";
import { ItemSource, ItemState, TextDirection } from "@app/schemas/db";
import { render, screen } from "@app/utils/test";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockIsSavedOffline = false;
vi.mock("@app/components/Items/useOfflineArticle", () => ({
  useOfflineArticle: () => ({
    isSavedOffline: mockIsSavedOffline,
    downloadArticleOffline: vi.fn(),
    removeArticleOffline: vi.fn(),
  }),
}));

describe("ItemMetadata component", () => {
  const mockItem: Item = {
    id: "item-sidebar-1",
    profileItemId: "profile-sidebar-1",
    slug: "sidebar-article-slug",
    url: "https://example.com/sidebar-story",
    createdAt: new Date().toISOString(),
    excerpt: "Sidebar story excerpt",
    labels: [],
    metadata: {
      title: "Sidebar Story Title",
      author: "Test Author",
      description: "Sidebar Story Description",
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
      publishedAt: new Date().toISOString(),
    },
  };

  beforeEach(() => {
    mockIsSavedOffline = false;
  });

  it("renders Saved offline indicator in sidebar when isSavedOffline is true", () => {
    mockIsSavedOffline = true;
    render(<ItemMetadata item={mockItem} />);

    expect(
      screen.getByTestId("item-sidebar-saved-offline"),
    ).toBeInTheDocument();
    expect(screen.getByText("Saved offline")).toBeInTheDocument();
  });

  it("does not render Saved offline indicator when isSavedOffline is false", () => {
    mockIsSavedOffline = false;
    render(<ItemMetadata item={mockItem} />);

    expect(
      screen.queryByTestId("item-sidebar-saved-offline"),
    ).not.toBeInTheDocument();
  });
});
