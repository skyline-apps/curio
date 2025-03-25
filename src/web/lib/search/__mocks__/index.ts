import { vi } from "vitest";

import {
  HighlightDocument,
  HighlightSearchResults,
  ItemDocument,
  ItemSearchResults,
  SearchOptions,
} from "@web/lib/search/types";

export class Search {
  async indexItemDocuments(_documents: ItemDocument[]): Promise<void> {}

  async searchItemDocuments(
    _query: string,
    _options?: SearchOptions,
  ): Promise<ItemSearchResults> {
    return { hits: [], estimatedTotalHits: 0 };
  }

  async indexHighlightDocuments(
    _documents: HighlightDocument[],
  ): Promise<void> {}

  async searchHighlightDocuments(
    _query: string,
    _profileId: string,
    _options?: SearchOptions,
  ): Promise<HighlightSearchResults> {
    return { hits: [], estimatedTotalHits: 0 };
  }

  async deleteHighlightDocuments(_highlightIds: string[]): Promise<void> {}
}

// Export singleton instance
export const search = new Search();

// Create spies for each method
export const indexItemDocuments = vi
  .spyOn(search, "indexItemDocuments")
  .mockImplementation(async () => {});
export const searchItemDocuments = vi
  .spyOn(search, "searchItemDocuments")
  .mockImplementation(async () => ({
    hits: [],
    estimatedTotalHits: 0,
  }));
export const indexHighlightDocuments = vi
  .spyOn(search, "indexHighlightDocuments")
  .mockImplementation(async () => {});
export const searchHighlightDocuments = vi
  .spyOn(search, "searchHighlightDocuments")
  .mockImplementation(async () => ({
    hits: [],
    estimatedTotalHits: 0,
  }));
export const deleteHighlightDocuments = vi
  .spyOn(search, "deleteHighlightDocuments")
  .mockImplementation(async () => {});
