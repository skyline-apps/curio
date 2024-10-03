/* eslint-disable no-restricted-imports */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/db/schema";

const client = postgres(process.env.POSTGRES_URL!);
export const db = drizzle(client, { schema });

export { eq, gt, gte, lt, lte, ne } from "drizzle-orm";
