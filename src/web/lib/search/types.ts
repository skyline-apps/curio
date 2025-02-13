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
  filter?: string;
  sort?: string[];
}

export interface ItemDocument {
  profileItemId: string;
  profileId: string;
  url?: string;
  slug?: string;
  content?: string;
  contentVersionName?: string;
}
