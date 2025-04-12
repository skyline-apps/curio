import { eq } from "@app/api/db";
import { checkDbError, DbError, DbErrorCode } from "@app/api/db/errors";
import { profiles } from "@app/api/db/schema";
import { apiDoc, APIResponse, describeRoute } from "@app/api/utils/api";
import { EnvBindings } from "@app/api/utils/env";
import { generateRandomAlphabetString } from "@app/api/utils/random";
import {
  UpdateEmailResponse,
  UpdateEmailResponseSchema,
} from "@app/schemas/v1/user/email";
import { Hono } from "hono";

// eslint-disable-next-line @local/eslint-local-rules/api-validation
export const userEmailRouter = new Hono<EnvBindings>().post(
  "/",
  describeRoute(apiDoc("post", null, UpdateEmailResponseSchema)),
  async (c): Promise<APIResponse<UpdateEmailResponse>> => {
    const log = c.get("log");
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
        log.error(`Failed to update newsletter email for user`, {
          profileId,
        });
        return c.json({ error: "Failed to update newsletter email." }, 500);
      }

      const response: UpdateEmailResponse = UpdateEmailResponseSchema.parse(
        updates[0],
      );
      return c.json(response);
    } catch (error) {
      if (checkDbError(error as DbError) === DbErrorCode.UniqueViolation) {
        log.error(`Failed to set unique newsletter email for user`, {
          profileId,
          error,
        });
        return c.json({ error: "Email already in use." }, 400);
      }
      log.error(`Unknown error updating newsletter email for user`, {
        profileId,
        error,
      });
      return c.json({ error: "Unknown error updating newsletter email." }, 500);
    }
  },
);
