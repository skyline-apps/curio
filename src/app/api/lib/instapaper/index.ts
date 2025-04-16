import crypto from "node:crypto";

import { createLogger, Logger, LoggerEnv } from "@app/api/utils/logger";
import { OAuth1TokenSchema } from "@app/schemas/db";
import axios, { AxiosError, AxiosRequestConfig } from "axios";
import OAuth from "oauth-1.0a";
import { z } from "zod";

import { InstapaperBookmark, InstapaperBookmarkSchema } from "./types";

export type OAuthToken = OAuth.Token;

const INSTAPAPER_API_BASE = "https://www.instapaper.com/api/1";
type InstapaperEnv = {
  INSTAPAPER_OAUTH_CONSUMER_ID: string;
  INSTAPAPER_OAUTH_CONSUMER_SECRET: string;
} & LoggerEnv;

export class Instapaper {
  private readonly consumerKey: string;
  private readonly consumerSecret: string;
  private readonly oauth: OAuth;
  private readonly log: Logger;

  constructor(env: InstapaperEnv) {
    this.log = createLogger(env);
    // Access directly via env
    const consumerKey = env.INSTAPAPER_OAUTH_CONSUMER_ID;
    const consumerSecret = env.INSTAPAPER_OAUTH_CONSUMER_SECRET;
    if (!consumerKey || !consumerSecret) {
      throw new Error("Instapaper consumer key and secret are required.");
    }
    this.consumerKey = consumerKey;
    this.consumerSecret = consumerSecret;

    this.oauth = new OAuth({
      consumer: {
        key: this.consumerKey,
        secret: this.consumerSecret,
      },
      signature_method: "HMAC-SHA1",
      hash_function(base_string: string, key: string) {
        return crypto
          .createHmac("sha1", key)
          .update(base_string)
          .digest("base64");
      },
    });
  }

  private async request<T>(
    url: string,
    method: "GET" | "POST",
    requestData: OAuth.RequestOptions,
    token?: OAuthToken,
  ): Promise<T> {
    const authHeader = this.oauth.toHeader(
      this.oauth.authorize(requestData, token),
    );

    const config: AxiosRequestConfig = {
      url: url,
      method: method,
      headers: {
        ...authHeader,
      },
      responseType: url.includes("/bookmarks/get_text") ? "text" : "json",
    };

    if (method === "POST") {
      config.headers = {
        ...config.headers,
        "Content-Type": "application/x-www-form-urlencoded",
      };
      config.data = new URLSearchParams(requestData.data).toString();
      if (url.includes("/oauth/access_token")) {
        config.responseType = "text";
      }
    }

    try {
      const response = await axios(config);

      // Handle different response types based on config/URL
      if (config.responseType === "text") {
        if (url.includes("/oauth/access_token")) {
          // Parse key-value pairs for access token
          const params = new URLSearchParams(response.data);
          return Object.fromEntries(params.entries()) as T;
        } else {
          // Return raw text/html for bookmark content
          return response.data as T;
        }
      } else {
        // Default: return JSON data (for /bookmarks/list)
        return response.data as T;
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      let errorText = axiosError.message;

      // Attempt to get more specific error text from response body
      if (axiosError.response?.data) {
        if (typeof axiosError.response.data === "string") {
          errorText = axiosError.response.data;
        } else {
          try {
            // Try parsing if it's JSON error object (Instapaper might return this)
            errorText = JSON.stringify(axiosError.response.data);
          } catch (error) {
            this.log.error("Error parsing Instapaper API response", { error });
          }
        }
      }

      throw new Error(`Instapaper API request failed: ${status} ${errorText}`);
    }
  }

  /**
   * Gets OAuth 1.0a access token and secret using username and password (xAuth).
   * Requires Instapaper partner access.
   */
  async getAccessToken(
    username: string,
    password: string,
  ): Promise<z.infer<typeof OAuth1TokenSchema>> {
    const requestData: OAuth.RequestOptions = {
      url: `${INSTAPAPER_API_BASE}/oauth/access_token`,
      method: "POST",
      data: {
        x_auth_username: username,
        x_auth_password: password,
        x_auth_mode: "client_auth",
      },
    };

    const tokenResponse = await this.request<Record<string, string>>(
      requestData.url,
      requestData.method as "POST",
      requestData,
    );

    return OAuth1TokenSchema.parse(tokenResponse);
  }

  /**
   * Lists bookmarks for the authenticated user.
   * Handles pagination using the 'have' parameter.
   */
  async listBookmarks(
    token: OAuthToken,
    limit: number = 500, // Max limit per Instapaper docs
    folderId?: string | number, // e.g., 'unread', 'archive', or a specific folder ID
    have?: string, // Comma-separated list of bookmark_ids already processed
  ): Promise<InstapaperBookmark[]> {
    const requestData: OAuth.RequestOptions = {
      url: `${INSTAPAPER_API_BASE}/bookmarks/list`,
      method: "POST",
      data: {
        limit: limit.toString(),
        ...(folderId && { folder_id: folderId.toString() }),
        ...(have && { have }),
      },
    };

    // The actual response contains more than just bookmarks (user info, highlights, folders)
    // We are simplifying here to just extract the bookmarks array.
    const response = await this.request<unknown[]>(
      requestData.url,
      requestData.method as "POST",
      requestData,
      token,
    );

    // Filter out non-bookmark items and parse
    const bookmarks = response
      .filter(
        (item: unknown): item is { type?: unknown } =>
          typeof item === "object" &&
          item !== null &&
          "type" in item &&
          item.type === "bookmark",
      )
      .map((item) => InstapaperBookmarkSchema.parse(item));

    return bookmarks;
  }

  /**
   * Gets the text (HTML) content of a specific bookmark.
   */
  async getBookmarkText(
    token: OAuthToken,
    bookmarkId: number,
  ): Promise<string> {
    const requestData: OAuth.RequestOptions = {
      url: `${INSTAPAPER_API_BASE}/bookmarks/get_text`,
      method: "POST",
      data: {
        bookmark_id: bookmarkId.toString(),
      },
    };

    return await this.request<string>(
      requestData.url,
      requestData.method as "POST",
      requestData,
      token,
    );
  }
}
