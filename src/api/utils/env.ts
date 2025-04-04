import { type Context } from "hono";

export interface Env {
  CURIO_URL: string; // Main application frontend domain
  CURIO_APP_SECRET: string; // Used for authenticating from other services
  CURIO_EMAIL_DOMAIN: string; // Used for validating received email addresses

  // Postgres
  POSTGRES_URL: string;

  // Supabase
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;

  // Search
  SEARCH_APPLICATION_API_KEY: string;
  SEARCH_ENDPOINT_URL: string;
  SEARCH_EXTERNAL_ENDPOINT_URL: string;

  // Environment
  NODE_ENV: string;
}

export type EnvBindings = {
  Bindings: Env;
  Variables: {
    userId: string;
    authOptional?: boolean;
  };
};

export type EnvContext = Context<EnvBindings>;
