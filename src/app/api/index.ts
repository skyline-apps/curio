/* eslint-disable @local/eslint-local-rules/api-middleware */
/* eslint-disable @local/eslint-local-rules/api-validation */
/* eslint-disable @local/eslint-local-rules/response-parse */
import logoutRoutes from "@app/api/auth/logout";
import sessionRoutes from "@app/api/auth/session";
import { getDb } from "@app/api/db";
import { requestLogger } from "@app/api/middleware/logger";
import { v1Router } from "@app/api/routesV1";
import { staticRouter } from "@app/api/routesV1/static";
import { EnvBindings } from "@app/api/utils/env";
// Uncommment the below to run import locally
// import {
//   itemsFetcherQueue,
//   type MessageBatch,
//   QueueMessage,
//   type WorkerEnv,
// } from "@app/queues/itemsFetcher";
import { ExecutionContext, Hono } from "hono";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";
import { openAPISpecs } from "hono-openapi";

export const api = new Hono<EnvBindings>();

// Middleware
api.use("*", requestLogger());
api.use("*", prettyJSON());
api.use("*", async (c, next) => {
  // Parse CORS origins from environment variable
  if (!c.env.VITE_CURIO_URL) {
    throw new Error("VITE_CURIO_URL environment variable is not set");
  }

  c.set("db", getDb(c.env));

  // Apply CORS middleware with dynamic origins
  return cors({
    origin: (origin) => {
      // If no origin in request or we're in development, allow any
      if (!origin || c.env.VITE_CURIO_URL.startsWith("http://")) {
        return "*";
      }

      const allowedOrigins = [
        c.env.VITE_CURIO_URL,
        // See https://ionicframework.com/docs/troubleshooting/cors#solutions-for-cors-errors.
        "https://curio", // For Android apps
        "capacitor://curio", // For iOS apps
      ];

      // Check if origin is in the allowed list
      return allowedOrigins.includes(origin) ? origin : null;
    },
    credentials: true,
  })(c, next);
});

// Authentication routes
api.route("/api/auth/session", sessionRoutes);
api.route("/api/auth/logout", logoutRoutes);

// Health check
api.get("/api/health", (c) => c.json({ status: "ok" }));

// API routes
api.route("/api/v1", v1Router);

// Static routes
api.route("/static", staticRouter);

// OpenAPI documentation
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

    // Handle /api/* and /static/* routes with the Hono app
    if (url.pathname.startsWith("/api") || url.pathname.startsWith("/static")) {
      return api.fetch(request, env, ctx);
    }

    return new Response(null, { status: 404 });
  },
  // async queue(
  //   batch: MessageBatch<QueueMessage>,
  //   env: WorkerEnv,
  // ): Promise<void> {
  //   await itemsFetcherQueue(batch, env);
  // },
};
