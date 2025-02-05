import { z } from "zod";

import { ItemState } from "@/db/schema";

export const UpdateStateRequestSchema = z.object({
  slugs: z
    .string()
    .transform((val) => (val ? val.split(",").map((s) => s.trim()) : undefined))
    .refine(
      (val) => !val || val.every((s) => s.length > 0),
      "Invalid slug format",
    )
    .describe(
      "A comma-separated list of slugs to update. If the slug is not found, it will be ignored.",
    ),
  state: z
    .string()
    .transform((val) => val as ItemState)
    .refine(
      (val) => Object.values(ItemState).includes(val as ItemState),
      `Invalid state value. Should be one of ${Object.values(ItemState).join(
        ", ",
      )}`,
    )
    .describe(
      `The new state of the items. Can be one of: ${Object.values(ItemState).join(", ")} `,
    ),
});

export type UpdateStateRequest = z.infer<typeof UpdateStateRequestSchema>;

export const UpdateStateResponseSchema = z.object({
  updated: z
    .array(
      z.object({
        slug: z.string(),
      }),
    )
    .describe("A list of slugs that were successfully updated."),
});

export type UpdateStateResponse = z.infer<typeof UpdateStateResponseSchema>;
