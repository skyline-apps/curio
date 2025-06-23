import { Item, PublicItem } from "@app/providers/Items";
import { type Highlight } from "@app/schemas/v1/items/highlights";
import { GetItemContentResponse } from "@app/schemas/v1/public/items/content";
import { createContext } from "react";

export type ItemWithContent = Omit<
  Exclude<GetItemContentResponse, { error: string }>,
  "content"
> & {
  content?: string;
};

export const ITEM_CONTENT_QUERY_KEY = "itemContent";

export type CurrentItemContextType = {
  currentItem: Item | PublicItem | null; // Metadata of currently loaded or selected item
  loadedItem: ItemWithContent | null; // Contents of currently loaded item
  isCurrentlyPreviewing: boolean; // Whether the current item is stored in query results
  inSelectionMode: boolean; // Whether the user is currently in selection mode
  selectedItems: Set<string>; // All selected item slugs
  selectItems: (
    // Selected items must be loaded by the ItemsProvider
    slugs: string[],
    index: number,
    options?: {
      replace?: boolean; // Clear out all other selections for this one
      selectRange?: boolean; // Select a range from the lastSelectionIndex to this index
      startSelecting?: boolean; // Start selecting, even if we're replacing
      showSidebar?: boolean; // Whether to show the sidebar at all
    },
  ) => void;
  previewItem: (item: Item | PublicItem) => void;
  clearSelectedItems: () => void;
  fetchContent: (slug: string, refresh?: boolean) => Promise<void>;
  loading: boolean;
  fetching: boolean;
  loadingError: string | null;
  lastSelectionIndex: number | null;
  setLastSelectionIndex: (index: number | null) => void;
  selectedHighlight: Highlight | null;
  setSelectedHighlight: (highlight: Highlight | null) => void;
  isEditable: (item: Item | PublicItem | null | undefined) => item is Item;
  explainHighlight: (snippet: string) => Promise<string | null>;
  fetchItemSummary: (
    slug: string,
    versionName?: string | null,
  ) => Promise<void>;
  itemSummary: string | null;
  viewingSummary: boolean;
  setViewingSummary: (viewingSummary: boolean) => void;
};

export const CurrentItemContext = createContext<CurrentItemContextType>({
  currentItem: null,
  loadedItem: null,
  isCurrentlyPreviewing: false,
  inSelectionMode: false,
  selectedItems: new Set<string>(),
  selectItems: () => {},
  previewItem: () => {},
  clearSelectedItems: () => {},
  fetchContent: () => Promise.resolve(),
  loading: true,
  fetching: false,
  loadingError: null,
  lastSelectionIndex: null,
  setLastSelectionIndex: () => {},
  selectedHighlight: null,
  setSelectedHighlight: () => {},
  isEditable: (item: Item | PublicItem | null | undefined): item is Item => {
    return item ? typeof item.profileItemId === "string" : false;
  },
  explainHighlight: () => Promise.resolve(null),
  fetchItemSummary: () => Promise.resolve(),
  itemSummary: null,
  viewingSummary: false,
  setViewingSummary: () => {},
});
