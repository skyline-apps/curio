import { authMiddleware } from "@api/middleware/auth";
import { EnvBindings, EnvContext } from "@api/utils/env";
import log from "@api/utils/logger";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { openAPISpecs } from "hono-openapi";

import { v1Router } from "./v1";

const app = new Hono<EnvBindings>();

const PUBLIC_ROUTES = ["/auth/callback", "/health", "/openapi", "/v1/public"];

// Middleware
app.use("*", logger(log));
app.use("*", prettyJSON());
app.use("*", async (c, next) => {
  // Parse CORS origins from environment variable
  if (!c.env.CURIO_URL) {
    throw new Error("CURIO_URL environment variable is not set");
  }

  // Apply CORS middleware with dynamic origins
  return cors({
    origin: (origin) => {
      // If no origin in request or we're in development, allow any
      if (!origin || c.env.NODE_ENV === "development") {
        return "*";
      }

      // Check if origin is in the allowed list
      return c.env.CURIO_URL === origin ? origin : null;
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

  return authMiddleware(c, next);
});

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// API routes
app.route("/v1", v1Router);

app.get(
  "/openapi",
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
