import { TransactionDB } from "@app/api/db";
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
  NODE_ENV: z.string(),
});

export type Env = z.infer<typeof EnvSchema>;

export type EnvBindings = {
  Bindings: Env;
  Variables: {
    db: TransactionDB;
    userId?: string;
    profileId?: string;
    authOptional?: boolean;
  };
};

export type EnvContext = Context<EnvBindings>;
