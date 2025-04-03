import { supabaseMock } from "@api/lib/supabase/__mocks__/client";
import { getRequest } from "@api/utils/test/api";
import { describe, expect, it, Mock } from "vitest";

import app from "./index";

describe("/api", () => {
  describe("GET /health", () => {
    it("should return 200", async () => {
      const response = await getRequest(app, "/health");
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ status: "ok" });
    });
  });

  describe("GET /openapi", () => {
    it("should return 200", async () => {
      const response = await getRequest(app, "/openapi");
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
      expect(data.paths).toHaveProperty("/v1/items");
    });
  });

  describe("Protected routes", () => {
    it("should return 401 when unauthenticated", async () => {
      (supabaseMock.auth.getUser as unknown as Mock).mockResolvedValue({
        data: {
          user: null,
        },
        error: null,
      });
      const response = await getRequest(app, "/v1/items");
      expect(response.status).toBe(401);
    });

    it("should return 200 when authenticated", async () => {
      const response = await getRequest(app, "/v1/items");
      expect(response.status).toBe(200);
    });
  });
});
