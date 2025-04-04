import "zod-openapi/extend";

import {
  ItemResultSchema,
  PublicItemResultSchema,
} from "@api/v1/items/validation";
import { z } from "zod";

export const GetProfileRequestSchema = z
  .object({
    username: z.string().describe("Username of the profile to fetch."),
    limit: z.coerce.number().min(1).max(1000).optional().default(20),
    cursor: z
      .string()
      .optional()
      .describe("The savedAt timestamp to start from."),
  })
  .strict();

export type GetProfileRequest = z.infer<typeof GetProfileRequestSchema>;

export const GetProfileResponseSchema = z
  .object({
    profile: z
      .object({
        username: z.string().describe("The username of the profile owner."),
        createdAt: z.date().describe("The creation date of the item."),
      })
      .strict(),
    favoriteItems: z
      .array(z.union([PublicItemResultSchema, ItemResultSchema]))
      .describe("List of favorited items."),
    nextCursor: z.string().optional(),
  })
  .strict();

export type GetProfileResponse = z.infer<typeof GetProfileResponseSchema>;
