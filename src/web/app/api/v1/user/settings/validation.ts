import { z } from "zod";

import { ColorScheme } from "@/db/schema";

export const SettingsSchema = z
  .object({
    colorScheme: z.nativeEnum(ColorScheme).describe("Color scheme to display."),
  })
  .strict();

export const UpdateableSettingsRequestSchema = SettingsSchema.partial();

export const SettingsResponseSchema = SettingsSchema;
export type SettingsResponse = z.infer<typeof SettingsResponseSchema>;

export const UpdatedSettingsRequestSchema = UpdateableSettingsRequestSchema;
export type UpdatedSettingsRequest = z.infer<
  typeof UpdatedSettingsRequestSchema
>;
export const UpdatedSettingsResponseSchema = SettingsSchema;
export type UpdatedSettingsResponse = z.infer<
  typeof UpdatedSettingsResponseSchema
>;
