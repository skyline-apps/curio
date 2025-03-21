import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { StorageError, VersionMetadata } from '@/lib/storage/types';
import config from '@/lib/config.json';
import { createLogger } from '@/utils/logger';

const log = createLogger("script/storage");
const ITEMS_BUCKET = config.storageItemsBucket;

export class ScriptStorage {
  private storage;

  constructor() {
    const supabase = createSupabaseClient(
      process.env.API_EXTERNAL_URL!,
      process.env.SERVICE_ROLE_KEY!,
    );
    this.storage = supabase.storage;
  }

  async getItemContent(slug: string): Promise<{ content: string }> {
    try {
      const path = `${slug}/default.md`;

      const { data, error } = await this.storage
        .from(ITEMS_BUCKET)
        .download(path);

      if (error) {
        // Try to read the error response
        const err = error as any;
        if (err.originalError instanceof Response) {
          const response = err.originalError;
          try {
            const errorBody = await response.text();
            log.error('Storage error:', {
              error: err,
              status: response.status,
              body: errorBody,
              url: response.url
            });
          } catch (e) {
            log.error('Failed to read error response:', { error: e });
          }
        } else {
          log.error('Storage error:', { error });
        }
        throw error;
      }

      const content = await data.text();
      return { content };
    } catch (error) {
      log.error("Failed to get item content", { error, slug });
      throw new StorageError(`Failed to get content for ${slug}`);
    }
  }

  async getItemMetadata(slug: string): Promise<VersionMetadata> {
    try {
      const path = `${slug}/default.md`;

      const { data, error } = await this.storage
        .from(ITEMS_BUCKET)
        .info(path);

      if (error) {
        // Try to read the error response
        const err = error as any;
        if (err.originalError instanceof Response) {
          const response = err.originalError;
          try {
            const errorBody = await response.text();
            log.error('Storage error:', {
              error: err,
              status: response.status,
              body: errorBody,
              url: response.url
            });
          } catch (e) {
            log.error('Failed to read error response:', { error: e });
          }
        } else {
          log.error('Storage error:', { error });
        }
        throw error;
      }

      return data.metadata as VersionMetadata;
    } catch (error) {
      log.error("Failed to get item metadata", { error, slug });
      throw new StorageError(`Failed to get metadata for ${slug}`);
    }
  }
}
