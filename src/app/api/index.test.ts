import { eq } from "@app/api/db";
import { DbErrorCode } from "@app/api/db/errors";
import { apiKeys, profiles } from "@app/api/db/schema";
import { supabaseMock } from "@app/api/lib/supabase/__mocks__/client";
import {
  DEFAULT_TEST_PROFILE_ID,
  DEFAULT_TEST_USER_ID,
  DEFAULT_TEST_USERNAME,
  DEFAULT_TEST_USERNAME_2,
  getRequest,
} from "@app/api/utils/test/api";
import { testDb } from "@app/api/utils/test/provider";
import fs from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from "vitest";

import app from "./index";

describe("/api", () => {
  describe("GET /api/health", () => {
    it("should return 200", async () => {
      const response = await getRequest(app, "/api/health");
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ status: "ok" });
    });
  });

  describe("GET /api/openapi", () => {
    it("should return 200", async () => {
      const response = await getRequest(app, "/api/openapi");
      expect(response.status).toBe(200);
      const data: {
        openapi: string;
        info: { title: string; version: string; description: string };
        paths: Record<string, unknown>;
      } = await response.json();
      expect(data.openapi).toEqual("3.1.0");
      expect(data.info.title).toEqual("Curio API");
      expect(data.info.version).toEqual("1.0.0");
      expect(data.info.description).toEqual("Curio API");
    });

    it("should include all API routes", async () => {
      const response = await getRequest(app, "/api/openapi");
      expect(response.status).toBe(200);
      const data: {
        openapi: string;
        info: { title: string; version: string; description: string };
        paths: Record<string, unknown>;
      } = await response.json();

      expect(data.paths).toHaveProperty("/api/v1/items");

      const routes: string[] = [];
      const crawlDirectory = async (dir: string): Promise<void> => {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });

        // Check if this is a leaf directory (contains index.ts but no subdirectories with index.ts)
        const hasIndex = entries.some(
          (e) => e.isFile() && e.name === "index.ts",
        );
        const hasSubdirsWithIndex = entries.some(
          (e) =>
            e.isDirectory() &&
            fs.existsSync(path.join(dir, e.name, "index.ts")),
        );

        if (hasIndex && !hasSubdirsWithIndex) {
          const relativePath = path.relative("./api/v1", dir);
          const routePath = "/" + relativePath.replace(/\\/g, "/");
          routes.push(routePath);
        }

        // Continue crawling subdirectories
        for (const entry of entries) {
          if (entry.isDirectory()) {
            await crawlDirectory(path.join(dir, entry.name));
          }
        }
      };

      await crawlDirectory("./api/v1");

      // Verify each found route exists in the OpenAPI paths
      routes.forEach((route) => {
        expect(data.paths).toHaveProperty(`/api/v1${route}`);
      });
    });
  });

  describe("Protected routes", () => {
    afterEach(async () => {
      await testDb.db
        .update(profiles)
        .set({ isEnabled: true })
        .where(eq(profiles.id, DEFAULT_TEST_PROFILE_ID));
    });

    it("should return 401 when unauthenticated", async () => {
      const response = await getRequest(app, "/api/v1/items");
      expect(response.status).toBe(401);
    });

    it("should return 200 when authenticated", async () => {
      (supabaseMock.auth.getUser as unknown as Mock).mockResolvedValue({
        data: {
          user: { id: DEFAULT_TEST_USER_ID, email: "user@example.com" },
        },
        error: null,
      });
      const response = await getRequest(app, "/api/v1/items");
      expect(response.status).toBe(200);
    });

    it("should return 401 when profile is disabled", async () => {
      await testDb.db
        .update(profiles)
        .set({ isEnabled: false })
        .where(eq(profiles.id, DEFAULT_TEST_PROFILE_ID));
      (supabaseMock.auth.getUser as unknown as Mock).mockResolvedValue({
        data: {
          user: { id: DEFAULT_TEST_USER_ID, email: "user@example.com" },
        },
        error: null,
      });
      const response = await getRequest(app, "/api/v1/items");
      expect(response.status).toBe(401);
    });

    it("should return 500 when authenticated but DB connection fails", async () => {
      vi.spyOn(testDb.db, "select").mockImplementationOnce(() => {
        throw { code: DbErrorCode.ConnectionFailure };
      });
      (supabaseMock.auth.getUser as unknown as Mock).mockResolvedValue({
        data: {
          user: { id: DEFAULT_TEST_USER_ID, email: "user@example.com" },
        },
        error: null,
      });

      const response = await getRequest(app, "/api/v1/items");
      expect(response.status).toBe(500);
    });

    describe("API keys", () => {
      let key: string;
      beforeEach(async () => {
        [{ key }] = await testDb.db
          .insert(apiKeys)
          .values({
            profileId: DEFAULT_TEST_PROFILE_ID,
            key: "ck_test123",
            name: "Test Key",
            isActive: true,
          })
          .returning();
      });

      afterEach(async () => {
        await testDb.db.delete(apiKeys);
      });

      it("should return 200 when authenticated with API key and update lastUsedAt", async () => {
        const apiKey = await testDb.db
          .select()
          .from(apiKeys)
          .where(eq(apiKeys.key, key));
        expect(apiKey[0]?.lastUsedAt).toBe(null);

        const response = await getRequest(
          app,
          "/api/v1/items",
          {},
          {
            "x-api-key": key,
          },
        );
        expect(response.status).toBe(200);

        const updatedKey = await testDb.db
          .select()
          .from(apiKeys)
          .where(eq(apiKeys.key, key));
        expect(updatedKey[0]?.lastUsedAt).toBeDefined();
      });

      it("should return 401 when invalid API key is used", async () => {
        const response = await getRequest(
          app,
          "/api/v1/items",
          {},
          {
            "x-api-key": "invalid-key",
          },
        );
        expect(response.status).toBe(401);
      });

      it("should return 401 when profile is disabled", async () => {
        await testDb.db
          .update(profiles)
          .set({ isEnabled: false })
          .where(eq(profiles.id, DEFAULT_TEST_PROFILE_ID));
        const response = await getRequest(
          app,
          "/api/v1/items",
          {},
          {
            "x-api-key": key,
          },
        );
        expect(response.status).toBe(401);
      });
    });
  });

  describe("Public routes", () => {
    it("should return 200 when unauthenticated", async () => {
      const response = await getRequest(app, "/api/v1/public/profile", {
        username: DEFAULT_TEST_USERNAME,
      });
      expect(response.status).toBe(200);
    });

    it("should return 200 when authenticated", async () => {
      (supabaseMock.auth.getUser as unknown as Mock).mockResolvedValue({
        data: {
          user: { id: DEFAULT_TEST_USER_ID, email: "user@example.com" },
        },
        error: null,
      });
      const response = await getRequest(app, "/api/v1/public/profile", {
        username: DEFAULT_TEST_USERNAME,
      });
      expect(response.status).toBe(200);
    });

    it("should return 200 when authenticated even if profile is private", async () => {
      (supabaseMock.auth.getUser as unknown as Mock).mockResolvedValue({
        data: {
          user: { id: DEFAULT_TEST_USER_ID, email: "user@example.com" },
        },
        error: null,
      });
      const response = await getRequest(app, "/api/v1/public/profile", {
        username: DEFAULT_TEST_USERNAME_2,
      });
      expect(response.status).toBe(200);
    });
  });
});
