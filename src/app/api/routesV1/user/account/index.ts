import { eq } from "@app/api/db";
import { profiles } from "@app/api/db/schema";
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
      const result = await db
        .delete(profiles)
        .where(eq(profiles.id, profileId))
        .returning({ id: profiles.id });
      if (result.length > 0) {
        return c.json(DeleteAccountResponseSchema.parse({ success: true }));
      }
      return c.json({ error: "Profile not found" }, 404);
    } catch (error) {
      log.error(`Error deleting user account`, { profileId, error });
      return c.json({ error: "Failed to delete account" }, 500);
    }
  },
);
