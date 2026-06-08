import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables from the root .env file
const envFile = process.env.ENV_FILE || ".env.staging";
dotenv.config({ path: resolve(process.cwd(), `../../${envFile}`) });

console.log("Migration script starting...");

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_ENDPOINT = process.env.R2_ENDPOINT!;

console.log("Config loaded:");
console.log(`  SUPABASE_URL: ${SUPABASE_URL}`);
console.log(`  R2_ENDPOINT: ${R2_ENDPOINT}`);
console.log(`  R2_ACCESS_KEY_ID: ${R2_ACCESS_KEY_ID ? "***" + R2_ACCESS_KEY_ID.slice(-4) : "MISSING"}`);

const R2_ITEMS_BUCKET = process.env.R2_ITEMS_BUCKET || "curio-items-staging";
const R2_IMPORT_BUCKET = process.env.R2_IMPORT_BUCKET || "curio-imports-staging";

if (!SUPABASE_URL || !SUPABASE_KEY || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT) {
  console.error("Missing required environment variables. Please check your .env.staging file.");
  process.exit(1);
}

console.log("Initializing clients...");
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const r2 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Sanitizes metadata values to be US-ASCII as required by S3/R2 headers.
 * Non-ASCII characters are removed.
 */
function sanitizeMetadataValue(value: string): string {
  const noNewlines = value.replace(/[\r\n]/g, " ");
  // eslint-disable-next-line no-control-regex
  return noNewlines.replace(/[^\x20-\x7E]/g, "");
}

async function migrateBucket(supabaseBucket: string, r2Bucket: string) {
  console.log(`\n--- Starting incremental migration: ${supabaseBucket} -> ${r2Bucket} ---`);

  let totalFound = 0;
  let totalMigrated = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  async function migratePath(path: string = "") {
    console.log(`  Scanning: "${path || "/"}"`);
    let offset = 0;
    const limit = 100;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { data, error } = await supabase.storage
        .from(supabaseBucket)
        .list(path, { limit, offset });

      if (error) {
        console.error(`    Error listing "${path}":`, error.message);
        throw error;
      }

      if (!data || data.length === 0) break;

      for (const item of data) {
        const fullPath = path ? `${path}/${item.name}` : item.name;
        
        if (item.id === null) {
          await migratePath(fullPath);
        } else {
          totalFound++;
          try {
            // Idempotency check
            try {
              await r2.send(new HeadObjectCommand({ Bucket: r2Bucket, Key: fullPath }));
              totalSkipped++;
              continue;
            } catch (err: any) {
              if (err.name !== "NotFound" && err.$metadata?.httpStatusCode !== 404) {
                throw err;
              }
            }

            process.stdout.write(`[${totalFound}] Migrating: ${fullPath} ... `);

            // 1. Download
            const { data: blob, error: downloadError } = await supabase.storage
              .from(supabaseBucket)
              .download(fullPath);

            if (downloadError) {
              console.log(`Failed (Download)!`);
              totalFailed++;
              continue;
            }

            // 2. Metadata
            const { data: info, error: infoError } = await supabase.storage
              .from(supabaseBucket)
              .info(fullPath);

            const metadata: Record<string, string> = {};
            if (!infoError && info?.metadata) {
              for (const [key, value] of Object.entries(info.metadata)) {
                if (typeof value === "string" || typeof value === "number") {
                  metadata[key] = sanitizeMetadataValue(String(value));
                }
              }
            }

            // 3. Upload
            const arrayBuffer = await blob.arrayBuffer();
            const command = new PutObjectCommand({
              Bucket: r2Bucket,
              Key: fullPath,
              Body: Buffer.from(arrayBuffer),
              ContentType: blob.type || "application/octet-stream",
              Metadata: metadata,
            });

            await r2.send(command);
            console.log(`Success!`);
            totalMigrated++;
          } catch (err: any) {
            console.log(`Failed!`);
            console.error(`    Error: ${err.message || "Unknown Error"}`);
            totalFailed++;
          }
        }
      }

      if (data.length < limit) break;
      offset += limit;
    }
  }

  await migratePath();
  console.log(`\nBucket ${supabaseBucket} finished:`);
  console.log(`  Total found: ${totalFound}`);
  console.log(`  Successfully migrated: ${totalMigrated}`);
  console.log(`  Skipped (already exists): ${totalSkipped}`);
  console.log(`  Failed: ${totalFailed}`);
}

async function verifyR2Connectivity() {
  console.log("Verifying R2 connectivity...");
  try {
    const { ListBucketsCommand } = await import("@aws-sdk/client-s3");
    // We can't really list buckets with most R2 tokens, so let's try to list the items bucket instead
    const { ListObjectsV2Command } = await import("@aws-sdk/client-s3");
    
    console.log(`  Testing access to bucket: ${R2_ITEMS_BUCKET}...`);
    await r2.send(new ListObjectsV2Command({ 
      Bucket: R2_ITEMS_BUCKET,
      MaxKeys: 1
    }));
    console.log("  R2 connectivity verified!");
  } catch (err: any) {
    console.error("  R2 Connectivity Check FAILED!");
    console.error(`  Error: ${err.name || "Error"} - ${err.message || "Unknown Error"}`);
    if (err.$metadata) {
      console.error("  Metadata:", JSON.stringify(err.$metadata, null, 2));
    }
    throw err;
  }
}

async function main() {
  try {
    await verifyR2Connectivity();
    await migrateBucket("items", R2_ITEMS_BUCKET);
    await migrateBucket("imports", R2_IMPORT_BUCKET);
    console.log("\nMigration completed successfully!");
  } catch (err: any) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  }
}

main();
