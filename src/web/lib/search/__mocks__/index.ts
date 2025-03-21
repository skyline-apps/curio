import { vi } from "vitest";

import {
  ItemDocument,
  ItemSearchResults,
  SearchOptions,
} from "@/lib/search/types";

export class Search {
  async indexItemDocuments(_documents: ItemDocument[]): Promise<void> {}

  async searchItemDocuments(
    _query: string,
    _profileId: string,
    _options?: SearchOptions,
  ): Promise<ItemSearchResults> {
    return { hits: [], estimatedTotalHits: 0 };
  }
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
