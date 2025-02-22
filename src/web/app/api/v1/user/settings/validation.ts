import { z } from "zod";

import { ColorScheme } from "@/db/schema";

export const SettingsSchema = z
  .object({
    colorScheme: z.nativeEnum(ColorScheme).describe("Color scheme to display."),
    public: z
      .boolean()
      .describe("Whether your profile and favorited items are public."),
  })
  .strict();

export const UpdateableSettingsSchema = SettingsSchema.partial();

export const SettingsResponseSchema = SettingsSchema;
export type SettingsResponse = z.infer<typeof SettingsResponseSchema>;

export const UpdatedSettingsRequestSchema = UpdateableSettingsSchema;
export type UpdatedSettingsRequest = z.infer<
  typeof UpdatedSettingsRequestSchema
>;
export const UpdatedSettingsResponseSchema = UpdateableSettingsSchema;
export type UpdatedSettingsResponse = z.infer<
  typeof UpdatedSettingsResponseSchema
>;
