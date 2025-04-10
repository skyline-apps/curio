/* eslint-disable @local/eslint-local-rules/api-middleware */
/* eslint-disable @local/eslint-local-rules/api-validation */
/* eslint-disable @local/eslint-local-rules/response-parse */
import { getDb } from "@app/api/db";
import { v1Router } from "@app/api/routesV1";
import { EnvBindings } from "@app/api/utils/env";
import log from "@app/api/utils/logger";
import { ExecutionContext, Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { openAPISpecs } from "hono-openapi";

export const api = new Hono<EnvBindings>();

// Middleware
api.use("*", logger(log));
api.use("*", prettyJSON());
api.use("*", async (c, next) => {
  // Parse CORS origins from environment variable
  if (!c.env.VITE_CURIO_URL) {
    throw new Error("VITE_CURIO_URL environment variable is not set");
  }

  c.set("db", getDb(c));

  // Apply CORS middleware with dynamic origins
  return cors({
    origin: (origin) => {
      // If no origin in request or we're in development, allow any
      if (!origin || c.env.NODE_ENV === "development") {
        return "*";
      }

      // Check if origin is in the allowed list
      return c.env.VITE_CURIO_URL === origin ? origin : null;
    },
    credentials: true,
  })(c, next);
});

// Health check
api.get("/api/health", (c) => c.json({ status: "ok" }));

// API routes
api.route("/api/v1", v1Router);

api.get(
  "/api/openapi",
  openAPISpecs(api, {
    documentation: {
      info: {
        title: "Curio API",
        version: "1.0.0",
        description: "Curio API",
      },
    },
  }),
);

export default {
  async fetch(
    request: Request,
    env: EnvBindings,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    // Handle /api/* routes with the Hono app
    if (url.pathname.startsWith("/api")) {
      return api.fetch(request, env, ctx);
    }

    return new Response(null, { status: 404 });
  },
};
