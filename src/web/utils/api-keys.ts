import { randomBytes } from "crypto";

import { and, db, desc, eq } from "@/db";
import { apiKeys, profiles, SelectApiKey } from "@/db/schema";
import { SupabaseClient } from "@/utils/supabase/server";

const API_KEY_PREFIX = "ck_";
const API_KEY_BYTES = 32;

export async function generateApiKey(): Promise<string> {
  const key = randomBytes(API_KEY_BYTES).toString("hex");
  return `${API_KEY_PREFIX}${key}`;
}

export async function createApiKey(
  supabase: SupabaseClient,
  name: string,
): Promise<SelectApiKey | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return null;
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, user.id),
  });
  if (!profile) {
    return null;
  }
  if (!name || name.length > 30) {
    return null;
  }

  const key = await generateApiKey();
  const [apiKey] = await db
    .insert(apiKeys)
    .values({
      profileId: profile.id,
      key,
      name,
    })
    .returning();

  return apiKey;
}

export async function listApiKeys(
  supabase: SupabaseClient,
): Promise<SelectApiKey[]> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return [];
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, user.id),
  });
  if (!profile) {
    return [];
  }

  return db.query.apiKeys.findMany({
    where: eq(apiKeys.profileId, profile.id),
    orderBy: [desc(apiKeys.createdAt)],
  });
}

export async function revokeApiKey(
  supabase: SupabaseClient,
  keyId: string,
): Promise<void> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return;
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, user.id),
  });
  if (!profile) {
    return;
  }

  await db
    .update(apiKeys)
    .set({ isActive: false })
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.profileId, profile.id)));
}

export async function validateApiKey(
  key: string,
): Promise<SelectApiKey | null> {
  const [apiKey] = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.key, key), eq(apiKeys.isActive, true)));

  if (!apiKey) {
    return null;
  }

  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, apiKey.id));

  return apiKey;
}
