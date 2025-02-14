// TODO: Use the Meilisearch JS SDK?
import axios, { AxiosError, AxiosInstance } from "axios";

import { db, sql } from "@/db";
import { appConfig } from "@/db/schema";
import { createLogger } from "@/utils/logger";

import {
  ItemDocument,
  SearchError,
  SearchOptions,
  SearchResults,
} from "./types";

const log = createLogger("lib/search");

interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
};

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const getBackoffDelay = (retryCount: number, config: RetryConfig): number => {
  const exponentialDelay = config.initialDelayMs * Math.pow(2, retryCount);
  return Math.min(exponentialDelay, config.maxDelayMs);
};

async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Don't retry if it's a 4xx error (except 429 - too many requests)
      if (error instanceof AxiosError && error.response?.status) {
        const status = error.response.status;
        if (status >= 400 && status < 500 && status !== 429) {
          throw new SearchError(
            `Search operation failed: ${error.message}`,
            status,
            error,
          );
        }
      }

      if (attempt === config.maxRetries) {
        break;
      }

      const delayMs = getBackoffDelay(attempt, config);
      await delay(delayMs);
    }
  }

  throw new SearchError(
    `Operation failed after ${config.maxRetries} retries`,
    undefined,
    lastError,
  );
}

export class Search {
  private axiosInstance: AxiosInstance | null = null;
  private lastUsedApiKey: string | null = null;
  private lastUsedEndpoint: string | null = null;

  private getSearchConfig(useExternal = true): {
    apiKey: string;
    endpoint: string;
  } {
    const apiKey = process.env.SEARCH_API_KEY;
    const endpoint = useExternal
      ? process.env.SEARCH_EXTERNAL_ENDPOINT_URL
      : process.env.SEARCH_ENDPOINT_URL;

    if (!apiKey) {
      throw new SearchError("SEARCH_API_KEY environment variable is not set");
    }
    if (!endpoint) {
      throw new SearchError(
        useExternal
          ? "SEARCH_EXTERNAL_ENDPOINT_URL environment variable is not set"
          : "SEARCH_ENDPOINT_URL environment variable is not set",
      );
    }
    return { apiKey, endpoint };
  }
  private async createAxiosInstance(): Promise<AxiosInstance> {
    const { apiKey, endpoint } = this.getSearchConfig();

    if (
      this.axiosInstance &&
      (this.lastUsedApiKey !== apiKey || this.lastUsedEndpoint !== endpoint)
    ) {
      this.resetAxiosInstance();
    }

    if (!this.axiosInstance) {
      this.axiosInstance = axios.create({
        baseURL: endpoint,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });
      this.lastUsedApiKey = apiKey;
      this.lastUsedEndpoint = endpoint;
      this.populateSearchConfig();
    }

    return this.axiosInstance;
  }

  public resetAxiosInstance(): void {
    this.axiosInstance = null;
    this.lastUsedApiKey = null;
    this.lastUsedEndpoint = null;
    log.info("Axios instance reset.");
  }

  async populateSearchConfig(): Promise<void> {
    // The database connects directly to the search endpoint on a shared Docker network in development mode.
    const { apiKey, endpoint } = this.getSearchConfig(false);
    await db
      .insert(appConfig)
      .values([
        {
          key: "SEARCH_ENDPOINT_URL",
          value: endpoint,
        },
        {
          key: "SEARCH_API_KEY",
          value: apiKey,
        },
      ])
      .onConflictDoUpdate({
        target: [appConfig.key],
        set: { value: sql`excluded.value` },
      });
  }

  async indexDocuments(documents: ItemDocument[]): Promise<void> {
    const axiosInstance = await this.createAxiosInstance();

    await withRetry(async () => {
      const response = await axiosInstance.put(
        "/indexes/items/documents",
        documents,
      );
      if (response.status !== 202) {
        throw new SearchError(`Unexpected status code: ${response.status}`);
      }
    });
  }

  async searchDocuments(
    query: string,
    profileId: string,
    options: SearchOptions = {},
  ): Promise<SearchResults> {
    const axiosInstance = await this.createAxiosInstance();

    const searchOptions = {
      ...options,
      filter: [...(options.filter || []), `profileId = ${profileId}`],
    };

    return withRetry(async () => {
      const response = await axiosInstance.post("/indexes/items/search", {
        q: query,
        attributesToRetrieve: ["profileItemId"],
        highlightPreTag: "**",
        highlightPostTag: "**",
        cropLength: 40,
        ...searchOptions,
      });

      if (!response.data || !Array.isArray(response.data.hits)) {
        throw new SearchError("Invalid search response format");
      }

      return {
        hits: response.data.hits,
        estimatedTotalHits: response.data.estimatedTotalHits,
      };
    });
  }
}

// Export singleton instance
export const search = new Search();

// Export bound methods to preserve 'this' context
export const indexDocuments = (documents: ItemDocument[]): Promise<void> =>
  search.indexDocuments(documents);
export const searchDocuments = (
  query: string,
  profileId: string,
  options?: SearchOptions,
): Promise<SearchResults> => search.searchDocuments(query, profileId, options);
