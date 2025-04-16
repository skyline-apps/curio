import { z } from "zod";

export const EnvSchema = z.object({
  POSTGRES_URL: z.string(),
  INSTAPAPER_OAUTH_CONSUMER_ID: z.string(),
  INSTAPAPER_OAUTH_CONSUMER_SECRET: z.string(),
  AXIOM_TOKEN: z.string().optional(),
  AXIOM_DATASET: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;
