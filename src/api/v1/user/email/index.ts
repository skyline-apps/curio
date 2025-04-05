import { eq } from "@api/db";
import { checkDbError, DbError, DbErrorCode } from "@api/db/errors";
import { profiles } from "@api/db/schema";
import { apiDoc, APIResponse, parseError } from "@api/utils/api";
import { EnvBindings } from "@api/utils/env";
import log from "@api/utils/logger";
import { generateRandomAlphabetString } from "@api/utils/random";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator as zValidator } from "hono-openapi/zod";

import {
  UpdateEmailRequest,
  UpdateEmailRequestSchema,
  UpdateEmailResponse,
  UpdateEmailResponseSchema,
} from "./validation";

export const userEmailRouter = new Hono<EnvBindings>().post(
  "/",
  describeRoute(
    apiDoc("post", UpdateEmailRequestSchema, UpdateEmailResponseSchema),
  ),
  zValidator(
    "json",
    UpdateEmailRequestSchema,
    parseError<UpdateEmailRequest, UpdateEmailResponse>,
  ),
  async (c): Promise<APIResponse<UpdateEmailResponse>> => {
    const profileId = c.get("profileId")!;

    try {
      const curioEmailDomain = c.env.CURIO_EMAIL_DOMAIN;

      const randomString = generateRandomAlphabetString();
      if (!curioEmailDomain) {
        return c.json(
          { error: "Failed to update newsletter email without domain." },
          500,
        ) as APIResponse<UpdateEmailResponse>;
      }
      const newsletterEmail = `${randomString}@${curioEmailDomain}`;
      const db = c.get("db");

      const updates = await db
        .update(profiles)
        .set({ newsletterEmail })
        .where(eq(profiles.id, profileId))
        .returning({ updatedNewsletterEmail: profiles.newsletterEmail });

      if (!updates.length) {
        log(`Failed to update newsletter email for user ${profileId}.`);
        return c.json({ error: "Failed to update newsletter email." }, 500);
      }

      const response: UpdateEmailResponse = UpdateEmailResponseSchema.parse(
        updates[0],
      );
      return c.json(response);
    } catch (error) {
      if (checkDbError(error as DbError) === DbErrorCode.UniqueViolation) {
        log(`Failed to set unique email for ${profileId}.`, error);
        return c.json({ error: "Email already in use." }, 400);
      }
      log(`Error updating newsletter email for user ${profileId}:`, error);
      return c.json({ error: "Unknown error updating newsletter email." }, 500);
    }
  },
);
