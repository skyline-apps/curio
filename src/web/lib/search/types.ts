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
  title: string;
  description: string;
  content: string;
  stateEnum: number;
  isFavorite: number;
  [key: string]: unknown; // Allow for additional fields
}
