import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./db/schema.ts",
  schemaFilter: ["public"],
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
});
