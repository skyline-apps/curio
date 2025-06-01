import { TransactionDB } from "@app/api/db";
import { type Logger } from "@app/api/utils/logger";
import { Queue } from "@cloudflare/workers-types";
import { type Context } from "hono";
import { z } from "zod";

export const EnvSchema = z.object({
  VITE_CURIO_URL: z.string().describe("Main application frontend domain"),
  CURIO_APP_SECRET: z
    .string()
    .describe("Used for authenticating from other services"),
  CURIO_EMAIL_DOMAIN: z
    .string()
    .describe("Used for validating received email addresses"),
  POSTGRES_URL: z.string(),
  VITE_SUPABASE_URL: z.string(),
  VITE_SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  SEARCH_APPLICATION_API_KEY: z.string(),
  SEARCH_ENDPOINT_URL: z.string(),
  SEARCH_EXTERNAL_ENDPOINT_URL: z.string(),
  AXIOM_TOKEN: z.string(),
  AXIOM_DATASET: z.string(),
  INSTAPAPER_OAUTH_CONSUMER_ID: z.string(),
  INSTAPAPER_OAUTH_CONSUMER_SECRET: z.string(),
});

export type Env = z.infer<typeof EnvSchema> & {
  ITEMS_FETCHER_QUEUE: Queue;
};

export type EnvBindings = {
  Bindings: Env;
  Variables: {
    db: TransactionDB;
    userId?: string;
    profileId?: string;
    authOptional?: boolean;
    log: Logger;
  };
};

export type EnvContext = Context<EnvBindings>;
