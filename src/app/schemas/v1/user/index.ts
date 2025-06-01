import "zod-openapi/extend";

import { dateType } from "@app/schemas/types";
import { z } from "zod";

export const GetUserResponseSchema = z.object({
  username: z.string(),
  newsletterEmail: z.string().nullable(),
  isPremium: z.boolean(),
  premiumExpiresAt: dateType.nullable(),
  upgradeBannerLastShownAt: dateType.nullable(),
});

export type GetUserResponse = z.infer<typeof GetUserResponseSchema>;
