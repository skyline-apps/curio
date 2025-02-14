export class SearchError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly originalError?: Error,
  ) {
    super(message);
    this.name = "SearchError";
  }
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  filter?: string[];
  attributesToCrop?: string[];
  attributesToRetrieve?: string[];
  attributesToHighlight?: string[];
}

export interface ItemDocument {
  profileItemId: string;
  profileId: string;
  url?: string;
  slug?: string;
  content?: string;
  contentVersionName?: string;
}

export interface ItemDocumentResult extends Omit<ItemDocument, "profileId"> {
  profileId?: string;
  _formatted: {
    content?: string;
  };
}

export interface SearchResults {
  hits: ItemDocumentResult[];
  estimatedTotalHits: number;
}
