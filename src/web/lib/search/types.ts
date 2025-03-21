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
  slug: string;
  url: string;
  title: string;
  description?: string;
  author?: string;
  content?: string;
  contentVersionName?: string;
}

export interface ItemDocumentResult extends ItemDocument {
  _formatted: {
    content?: string;
  };
}

export interface ItemSearchResults {
  hits: ItemDocumentResult[];
  estimatedTotalHits: number;
}

export interface HighlightDocument {
  id: string;
  profileId: string;
  profileItemId: string;
  slug: string;
  url: string;
  title: string;
  description?: string;
  author?: string;
  highlightText: string;
  note: string;
  startOffset: number;
  endOffset: number;
  updatedAt: Date;
}

export interface HighlightDocumentResult extends HighlightDocument {
  _formatted: {
    highlightText?: string;
    note?: string;
  };
}

export interface HighlightSearchResults {
  hits: HighlightDocumentResult[];
  estimatedTotalHits: number;
}
