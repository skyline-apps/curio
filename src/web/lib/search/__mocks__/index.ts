import { vi } from "vitest";

import { ItemDocument, SearchOptions, SearchResults } from "@/lib/search/types";

export class Search {
  async indexDocuments(_documents: ItemDocument[]): Promise<void> {}

  async searchDocuments(
    _query: string,
    _profileId: string,
    _options?: SearchOptions,
  ): Promise<SearchResults> {
    return { hits: [], estimatedTotalHits: 0 };
  }
}

// Export singleton instance
export const search = new Search();

// Create spies for each method
export const indexDocuments = vi
  .spyOn(search, "indexDocuments")
  .mockImplementation(async () => {});
export const searchDocuments = vi
  .spyOn(search, "searchDocuments")
  .mockImplementation(async () => ({
    hits: [],
    estimatedTotalHits: 0,
  }));
