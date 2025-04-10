import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./api/db/schema.ts",
  schemaFilter: ["public"],
  out: "./api/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
});
