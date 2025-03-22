import { config } from 'dotenv';

// Load environment variables from specified .env file
config({ path: process.env.DOTENV_CONFIG_PATH });
console.log('Loading .env from:', process.env.DOTENV_CONFIG_PATH);


import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { items, profileItems, profileItemHighlights } from '@/db/schema';
import { sql, eq, inArray } from 'drizzle-orm';
import { ItemDocument, HighlightDocument } from '@/lib/search/types';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { readFileSync } from 'fs';
import { ExtractedMetadata } from '@/lib/extract/types';
import { ScriptStorage } from './storage';

// Verify required environment variables
const requiredEnvVars = [
  'POSTGRES_URL',
  'SEARCH_EXTERNAL_ENDPOINT_URL',
  'SEARCH_APPLICATION_API_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    console.error('Please create a .env file based on .env.template');
    process.exit(1);
  }
}

const BATCH_SIZE = 100;

async function backfillItems(client: postgres.Sql<any>, meilisearchUrl: string, meilisearchKey: string, slugFile: string) {
  const db = drizzle(client);
  const storage = new ScriptStorage();
  const slugs = readFileSync(slugFile, 'utf-8').split('\n').filter(Boolean);
  if (slugs.length === 0) {
    console.error('No slugs found in file');
    return;
  }
  console.log(`Processing ${slugs.length} items...`);
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const batchSlugs = slugs.slice(offset, offset + BATCH_SIZE);
    if (batchSlugs.length === 0) {
      hasMore = false;
      continue;
    }

    // Get URLs from the items table
    const query = sql`
      SELECT slug, url FROM items
      WHERE slug = ANY(ARRAY[${sql.join(batchSlugs.map(slug => sql`${slug}`), sql`, `)}])
    `;
    const itemUrls = await db.execute(query);
    const urlMap = new Map(itemUrls.map((item: any) => [item.slug, item.url]));

    const documents: ItemDocument[] = await Promise.all(batchSlugs.map(async (slug) => {
      // Get latest content and metadata from storage
      const [{ content }, metadata] = await Promise.all([
        storage.getItemContent(slug),
        storage.getItemMetadata(slug)
      ]);

      // Extract fields from metadata
      const url = urlMap.get(slug);
      if (!url) {
        throw new Error(`No URL found for slug: ${slug}`);
      }

      // Access fields from VersionMetadata which extends ExtractedMetadata
      const { title, description, author, timestamp } = metadata;
      return {
        slug,
        url,
        title: title || '',
        description: description || undefined,
        author: author || undefined,
        content,
        contentVersionName: timestamp,
      };
    }));

    // Send to Meilisearch
    const response = await fetch(`${meilisearchUrl}/indexes/items/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${meilisearchKey}`,
      },
      body: JSON.stringify(documents),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Meilisearch error:', error);
      throw new Error(`Meilisearch request failed: ${error}`);
    }

    offset += BATCH_SIZE;
    console.log(`Processed batch of ${documents.length} items`);
  }
}

async function backfillHighlights(client: postgres.Sql<any>, meilisearchUrl: string, meilisearchKey: string, idFile: string) {
  const ids = readFileSync(idFile, 'utf-8').split('\n').filter(Boolean);
  if (ids.length === 0) {
    console.error('No IDs found in file');
    return;
  }
  console.log(`Processing ${ids.length} highlights...`);
  const db = drizzle(client);
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const batchIds = ids.slice(offset, offset + BATCH_SIZE);
    if (batchIds.length === 0) {
      hasMore = false;
      continue;
    }

    const query = sql`
      SELECT
        profile_item_highlights.id,
        profile_items.profile_id,
        profile_item_highlights.profile_item_id,
        items.slug,
        items.url,
        profile_items.title,
        profile_items.text_direction,
        profile_items.author,
        profile_item_highlights.text,
        profile_item_highlights.note,
        profile_item_highlights.start_offset,
        profile_item_highlights.end_offset,
        profile_item_highlights.updated_at
      FROM profile_item_highlights
      INNER JOIN profile_items ON profile_item_highlights.profile_item_id = profile_items.id
      INNER JOIN items ON profile_items.item_id = items.id
      WHERE profile_item_highlights.id = ANY(ARRAY[${sql.join(batchIds.map(id => sql`${id}::uuid`), sql`, `)}])
    `;
      

    const highlightsData = await db.execute(query);

    if (highlightsData.length === 0) {
      hasMore = false;
      continue;
    }

    const documents: HighlightDocument[] = highlightsData.map((row: any) => ({
      id: row.id,
      profileId: row.profile_id,
      profileItemId: row.profile_item_id,
      slug: row.slug,
      url: row.url,
      title: row.title,
      textDirection: row.text_direction || undefined,
      author: row.author || undefined,
      highlightText: row.text,
      note: row.note || '',
      startOffset: row.start_offset,
      endOffset: row.end_offset,
      updatedAt: new Date(row.updated_at),
    }));

    // Send to Meilisearch
    const response = await fetch(`${meilisearchUrl}/indexes/highlights/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${meilisearchKey}`,
      },
      body: JSON.stringify(documents),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Meilisearch error:', error);
      throw new Error(`Meilisearch request failed: ${error}`);
    }

    offset += BATCH_SIZE;
    console.log(`Processed batch of ${highlightsData.length} highlights`);
  }
}

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option('items', {
      type: 'boolean',
      description: 'Backfill items index',
    })
    .option('highlights', {
      type: 'boolean',
      description: 'Backfill highlights index',
    })
    .option('input-file', {
      type: 'string',
      description: 'Path to file containing IDs to process (one per line)',
      demandOption: true,
    })
    .check((argv) => {
      if (!argv.items && !argv.highlights) {
        throw new Error('Must specify either --items or --highlights');
      }
      return true;
    })
    .argv;

  const client = postgres(process.env.POSTGRES_URL!);

  try {


    if (argv.items) {
      await backfillItems(client, process.env.SEARCH_EXTERNAL_ENDPOINT_URL!, process.env.SEARCH_APPLICATION_API_KEY!, argv.inputFile);
    }

    if (argv.highlights) {
      await backfillHighlights(client, process.env.SEARCH_EXTERNAL_ENDPOINT_URL!, process.env.SEARCH_APPLICATION_API_KEY!, argv.inputFile);
    }

  } finally {
    await client.end();
  }
}

main().catch(console.error);
