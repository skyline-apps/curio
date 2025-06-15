import { eq } from "@app/api/db";
import { profiles } from "@app/api/db/schema";
import { EnvContext } from "@app/api/utils/env";
import { createMiddleware } from "hono/factory";

export const premiumMiddleware = createMiddleware(
  async (c: EnvContext, next: () => Promise<Response | void>) => {
    const db = c.get("db");
    const profileId = c.get("profileId");
    if (!profileId) {
      return c.json(
        { error: "Unauthorized", message: "No profile found." },
        401,
      );
    }
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, profileId));
    if (!profile) {
      return c.json(
        { error: "Unauthorized", message: "Profile not found." },
        401,
      );
    }
    if (!profile.isPremium || !profile.premiumExpiresAt) {
      return c.json(
        { error: "Premium required", message: "User is not premium." },
        402,
      );
    }
    const now = new Date();
    const expiresAt = new Date(profile.premiumExpiresAt);
    if (expiresAt < now) {
      return c.json(
        { error: "Premium expired", message: "Premium subscription expired." },
        402,
      );
    }
    return next();
  },
);
