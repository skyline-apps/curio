import axios, { AxiosError, AxiosInstance } from "axios";

import { ItemDocument, SearchError, SearchOptions } from "./types";

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

  private createAxiosInstance(): AxiosInstance {
    const apiKey = process.env.MEILI_API_KEY;
    const endpoint = process.env.MEILI_ENDPOINT_URL;

    if (!apiKey) {
      throw new SearchError("MEILI_API_KEY environment variable is not set");
    }
    if (!endpoint) {
      throw new SearchError(
        "MEILI_ENDPOINT_URL environment variable is not set",
      );
    }

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
    }

    return this.axiosInstance;
  }

  public resetAxiosInstance(): void {
    this.axiosInstance = null;
    this.lastUsedApiKey = null;
    this.lastUsedEndpoint = null;
  }

  async indexDocuments(documents: ItemDocument[]): Promise<void> {
    const axiosInstance = this.createAxiosInstance();

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
    options: SearchOptions = {},
  ): Promise<ItemDocument[]> {
    const axiosInstance = this.createAxiosInstance();

    return withRetry(async () => {
      const response = await axiosInstance.post("/indexes/items/search", {
        q: query,
        ...options,
      });

      if (!response.data || !Array.isArray(response.data.hits)) {
        throw new SearchError("Invalid search response format");
      }

      return response.data.hits;
    });
  }
}

// Export singleton instance
export const search = new Search();

export const { indexDocuments, searchDocuments } = search;
