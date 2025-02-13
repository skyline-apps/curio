import { jest } from "@jest/globals";

import { ItemDocument, SearchOptions } from "@/lib/search/types";

export class Search {
  async indexDocuments(_documents: ItemDocument[]): Promise<void> {}

  async searchDocuments(
    _query: string,
    _options?: SearchOptions,
  ): Promise<ItemDocument[]> {
    return [];
  }
}

// Export singleton instance
export const search = new Search();

// Create spies for each method
export const indexDocuments = jest
  .spyOn(search, "indexDocuments")
  .mockImplementation(async () => {});
export const searchDocuments = jest
  .spyOn(search, "searchDocuments")
  .mockImplementation(async () => []);
