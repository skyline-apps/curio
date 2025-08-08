import { eq } from "@app/api/db";
import { profiles } from "@app/api/db/schema";
import { createClient } from "@app/api/lib/supabase/client";
import {
  apiDoc,
  APIResponse,
  describeRoute,
  parseError,
  zValidator,
} from "@app/api/utils/api";
import { EnvBindings } from "@app/api/utils/env";
import {
  DeleteAccountRequest,
  DeleteAccountRequestSchema,
  DeleteAccountResponse,
  DeleteAccountResponseSchema,
} from "@app/schemas/v1/user/account";
import { Hono } from "hono";

export const userAccountRouter = new Hono<EnvBindings>().delete(
  "/",
  describeRoute(
    apiDoc("delete", DeleteAccountRequestSchema, DeleteAccountResponseSchema),
  ),
  zValidator(
    "json",
    DeleteAccountRequestSchema,
    parseError<DeleteAccountRequest, DeleteAccountResponse>,
  ),
  async (c): Promise<APIResponse<DeleteAccountResponse>> => {
    const log = c.get("log");
    const profileId = c.get("profileId");
    if (!profileId) {
      return c.json({ error: "Not authenticated" }, 401);
    }
    try {
      const db = c.get("db");
      // Fetch profile to get userId
      const profile = await db.query.profiles.findFirst({
        where: (p, { eq }) => eq(p.id, profileId),
      });
      if (!profile) {
        return c.json({ error: "Profile not found" }, 404);
      }
      // Delete profile
      await db.delete(profiles).where(eq(profiles.id, profileId));
      // Delete user from Supabase Auth
      try {
        const supabase = await createClient(c, true); // admin
        const { error: authError } = await supabase.auth.admin.deleteUser(
          profile.userId,
          true,
        );
        if (authError) {
          log.error("Failed to delete user from Supabase Auth", { authError });
          return c.json({ error: "Failed to delete user from auth" }, 500);
        }
      } catch (err) {
        log.error("Supabase admin error", { err });
        return c.json({ error: "Failed to delete user from auth" }, 500);
      }
      return c.json(DeleteAccountResponseSchema.parse({ success: true }));
    } catch (error) {
      log.error(`Error deleting user account`, { profileId, error });
      return c.json({ error: "Failed to delete account" }, 500);
    }
  },
);
