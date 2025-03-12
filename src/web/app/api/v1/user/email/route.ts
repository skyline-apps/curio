import { db, eq } from "@/db";
import { checkDbError, DbError, DbErrorCode } from "@/db/errors";
import { profiles } from "@/db/schema";
import { CURIO_EMAIL_DOMAIN } from "@/lib/email";
import { APIRequest, APIResponse, APIResponseJSON } from "@/utils/api";
import { checkUserProfile } from "@/utils/api/server";
import { createLogger } from "@/utils/logger";
import { generateRandomAlphabetString } from "@/utils/random";

import { UpdateEmailResponse, UpdateEmailResponseSchema } from "./validation";

const log = createLogger("api/v1/user/email");

/** @no-request */
export async function POST(
  request: APIRequest,
): Promise<APIResponse<UpdateEmailResponse>> {
  const userId = request.headers.get("x-user-id");

  try {
    const profileResult = await checkUserProfile(userId);
    if ("error" in profileResult) {
      return profileResult.error as APIResponse<UpdateEmailResponse>;
    }

    const randomString = generateRandomAlphabetString();
    if (!CURIO_EMAIL_DOMAIN) {
      return APIResponseJSON(
        { error: "Failed to update newsletter email without domain." },
        { status: 500 },
      ) as APIResponse<UpdateEmailResponse>;
    }
    const newsletterEmail = `${randomString}@${CURIO_EMAIL_DOMAIN}`;

    const updates = await db
      .update(profiles)
      .set({ newsletterEmail })
      .where(userId ? eq(profiles.userId, userId) : undefined)
      .returning({ updatedNewsletterEmail: profiles.newsletterEmail });

    if (!updates.length) {
      log.error(`Failed to update newsletter email for user ${userId}.`);
      return APIResponseJSON(
        { error: "Failed to update newsletter email." },
        { status: 500 },
      );
    }

    const response: UpdateEmailResponse = UpdateEmailResponseSchema.parse(
      updates[0],
    );
    return APIResponseJSON(response);
  } catch (error) {
    if (checkDbError(error as DbError) === DbErrorCode.UniqueViolation) {
      return APIResponseJSON(
        { error: "Email already in use." },
        { status: 400 },
      );
    }
    log.error(`Error updating newsletter email for user ${userId}:`, error);
    return APIResponseJSON(
      { error: "Unknown error updating newsletter email." },
      { status: 500 },
    );
  }
}
