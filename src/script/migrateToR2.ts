import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables from the root .env file
dotenv.config({ path: resolve(process.cwd(), "../../.env.staging") });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_ENDPOINT = process.env.R2_ENDPOINT!;

const R2_ITEMS_BUCKET = process.env.R2_ITEMS_BUCKET || "curio-items-staging";
const R2_IMPORT_BUCKET = process.env.R2_IMPORT_BUCKET || "curio-imports-staging";

if (!SUPABASE_URL || !SUPABASE_KEY || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT) {
  console.error("Missing required environment variables. Please check your .env.staging file.");
  process.exit(1);
}

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
  // Remove newlines and carriage returns as they are invalid in headers
  const noNewlines = value.replace(/[\r\n]/g, " ");
  // Remove non-printable ASCII and non-ASCII characters
  // eslint-disable-next-line no-control-regex
  return noNewlines.replace(/[^\x20-\x7E]/g, "");
}

async function migrateBucket(supabaseBucket: string, r2Bucket: string) {
  console.log(`\n--- Migrating bucket: ${supabaseBucket} -> ${r2Bucket} ---`);

  // Recursive function to list all files
  async function listAllFiles(path: string = ""): Promise<string[]> {
    const { data, error } = await supabase.storage.from(supabaseBucket).list(path);
    if (error) throw error;

    let files: string[] = [];
    for (const item of data) {
      const fullPath = path ? `${path}/${item.name}` : item.name;
      if (item.id === null) {
        // It's a directory
        const subFiles = await listAllFiles(fullPath);
        files = [...files, ...subFiles];
      } else {
        files.push(fullPath);
      }
    }
    return files;
  }

  const files = await listAllFiles();
  console.log(`Found ${files.length} files in ${supabaseBucket}`);

  for (const file of files) {
    try {
      console.log(`Migrating: ${file}`);

      // Idempotency check: Check if file already exists in R2
      try {
        await r2.send(new HeadObjectCommand({ Bucket: r2Bucket, Key: file }));
        console.log(`  Already exists in R2, skipping.`);
        continue;
      } catch (err: any) {
        if (err.name !== "NotFound" && err.$metadata?.httpStatusCode !== 404) {
          throw err;
        }
        // File not found in R2, proceed with migration
      }

      // 1. Download from Supabase
      const { data: blob, error: downloadError } = await supabase.storage
        .from(supabaseBucket)
        .download(file);

      if (downloadError) {
        console.error(`  Failed to download ${file}:`, downloadError.message);
        continue;
      }

      // 2. Get Metadata from Supabase
      const { data: info, error: infoError } = await supabase.storage
        .from(supabaseBucket)
        .info(file);

      const metadata: Record<string, string> = {};
      if (!infoError && info?.metadata) {
        for (const [key, value] of Object.entries(info.metadata)) {
          if (typeof value === "string" || typeof value === "number") {
            metadata[key] = sanitizeMetadataValue(String(value));
          }
        }
      }

      // 3. Upload to R2
      const arrayBuffer = await blob.arrayBuffer();
      const command = new PutObjectCommand({
        Bucket: r2Bucket,
        Key: file,
        Body: Buffer.from(arrayBuffer),
        ContentType: blob.type || "application/octet-stream",
        Metadata: metadata,
      });

      await r2.send(command);
      console.log(`  Successfully migrated ${file}`);
    } catch (err: any) {
      console.error(`  Error migrating ${file}:`, err.message);
    }
  }
}

async function main() {
  try {
    await migrateBucket("items", R2_ITEMS_BUCKET);
    await migrateBucket("imports", R2_IMPORT_BUCKET);
    console.log("\nMigration completed successfully!");
  } catch (err: any) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  }
}

main();
