import type OAuth from "oauth-1.0a";
import { vi } from "vitest";

export type OAuthToken = OAuth.Token;
export const MOCK_ACCESS_TOKEN = {
  oauth_token: "fake-oauth-token",
  oauth_token_secret: "fake-oauth-secret",
};

export const mockGetAccessToken = vi.fn().mockResolvedValue(MOCK_ACCESS_TOKEN);
export const mockListBookmarks = vi.fn().mockResolvedValue([]);
export const mockGetBookmarkText = vi.fn().mockResolvedValue("");

export class Instapaper {
  constructor() {
    vi.fn();
  }

  getAccessToken = mockGetAccessToken;
  listBookmarks = mockListBookmarks;
  getBookmarkText = mockGetBookmarkText;
}
