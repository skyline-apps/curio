import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { Miniflare } from "../app/node_modules/miniflare/dist/src/index.js";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), "../../.env") });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

// @cloudflare/vite-plugin stores local R2 state under v3/ (not directly under state/)
const R2_PERSIST_PATH = resolve(process.cwd(), "../../src/app/.wrangler/state/v3/r2");
// The namespace ID Miniflare uses for the SQLite file is the bucket_name from
// wrangler.jsonc ("curio-items-local"), not the binding name ("ITEMS_BUCKET").
const BUCKET_MAP: Record<string, string> = {
  items: "curio-items-local",
  imports: "curio-imports-local",
};

console.log(`Supabase: ${SUPABASE_URL}`);
console.log(`R2 state: ${R2_PERSIST_PATH}`);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const mf = new Miniflare({
  modules: true,
  script: "export default {}",
  r2Buckets: Object.values(BUCKET_MAP),  // ["curio-items-local", "curio-imports-local"]
  r2Persist: R2_PERSIST_PATH,
});

async function migrateBucket(supabaseBucket: string, r2BucketName: string) {
  console.log(`\n--- Migrating: ${supabaseBucket} -> ${r2BucketName} ---`);
  const r2 = await mf.getR2Bucket(r2BucketName);
  let total = 0, migrated = 0, skipped = 0, failed = 0;

  async function migratePath(path: string = "") {
    let offset = 0;
    const limit = 100;

    while (true) {
      const { data, error } = await supabase.storage
        .from(supabaseBucket)
        .list(path, { limit, offset });

      if (error) throw error;
      if (!data || data.length === 0) break;

      for (const item of data) {
        const fullPath = path ? `${path}/${item.name}` : item.name;
        if (item.id === null) {
          await migratePath(fullPath);
        } else {
          total++;
          try {
            process.stdout.write(`[${total}] ${fullPath} ... `);
            const { data: blob, error: dlError } = await supabase.storage
              .from(supabaseBucket)
              .download(fullPath);

            if (dlError || !blob) {
              console.log("Failed (download)");
              failed++;
              continue;
            }

            const { data: info } = await supabase.storage
              .from(supabaseBucket)
              .info(fullPath);

            const customMetadata: Record<string, string> = {};
            if (info?.metadata) {
              for (const [key, value] of Object.entries(info.metadata)) {
                if (typeof value === "string" || typeof value === "number") {
                  customMetadata[key] = String(value).replace(/[\r\n]/g, " ").replace(/[^\x20-\x7E]/g, "");
                }
              }
            }

            await r2.put(fullPath, await blob.arrayBuffer(), {
              httpMetadata: { contentType: blob.type || "application/octet-stream" },
              customMetadata,
            });
            console.log("OK");
            migrated++;
          } catch (err: any) {
            console.log(`Failed: ${err.message}`);
            failed++;
          }
        }
      }

      if (data.length < limit) break;
      offset += limit;
    }
  }

  await migratePath();
  console.log(`  Found: ${total}, Migrated: ${migrated}, Skipped: ${skipped}, Failed: ${failed}`);
}

async function main() {
  try {
    for (const [supabaseBucket, r2BucketName] of Object.entries(BUCKET_MAP)) {
      await migrateBucket(supabaseBucket, r2BucketName);
    }
    console.log("\nDone!");
  } finally {
    await mf.dispose();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
