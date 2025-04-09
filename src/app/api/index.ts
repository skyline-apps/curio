/* eslint-disable @local/eslint-local-rules/api-middleware */
import { getDb } from "@app/api/db";
import { authMiddleware } from "@app/api/middleware/auth";
import { EnvBindings, EnvContext } from "@app/api/utils/env";
import log from "@app/api/utils/logger";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { openAPISpecs } from "hono-openapi";

import { v1Router } from "./v1";

const app = new Hono<EnvBindings>();

const PUBLIC_ROUTES = ["/api/auth/callback", "/api/health", "/api/openapi"];

// Middleware
app.use("*", logger(log));
app.use("*", prettyJSON());
app.use("*", async (c, next) => {
  // Parse CORS origins from environment variable
  if (!c.env.VITE_CURIO_URL) {
    throw new Error("VITE_CURIO_URL environment variable is not set");
  }

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
app.use("*", async (c: EnvContext, next) => {
  const path = new URL(c.req.url).pathname;

  // Skip auth for specific paths
  if (PUBLIC_ROUTES.includes(path)) {
    return next();
  }

  c.set("db", getDb(c));

  if (path.startsWith("/api/v1/public")) {
    c.set("authOptional", true);
    return authMiddleware(c, next);
  }

  return authMiddleware(c, next);
});

// Health check
app.get("/api/health", (c) => c.json({ status: "ok" }));

// API routes
app.route("/api/v1", v1Router);

app.get(
  "/api/openapi",
  openAPISpecs(app, {
    documentation: {
      info: {
        title: "Curio API",
        version: "1.0.0",
        description: "Curio API",
      },
    },
  }),
);

export default app;
