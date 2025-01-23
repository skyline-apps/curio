"use server";

import { SelectApiKey } from "@/db/schema";
import * as apiKeyUtils from "@/utils/api-keys";
import { createLogger } from "@/utils/logger";
import { createClient } from "@/utils/supabase/server";

const log = createLogger("settings.actions");

export async function createApiKey(name: string): Promise<SelectApiKey | null> {
  try {
    const supabase = await createClient();
    const apiKey = await apiKeyUtils.createApiKey(supabase, name);
    return apiKey;
  } catch (error) {
    log.error("Failed to create API key", { error });
    throw new Error("Failed to create API key");
  }
}

export async function listApiKeys(): Promise<SelectApiKey[]> {
  try {
    const supabase = await createClient();
    const apiKeys = await apiKeyUtils.listApiKeys(supabase);
    return apiKeys;
  } catch (error) {
    log.error("Failed to list API keys", { error });
    return [];
  }
}

export async function revokeApiKey(keyId: string): Promise<void> {
  try {
    const supabase = await createClient();
    await apiKeyUtils.revokeApiKey(supabase, keyId);
  } catch (error) {
    log.error("Failed to revoke API key", { error });
    throw new Error("Failed to revoke API key");
  }
}
