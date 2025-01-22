import { z } from "zod";

import { ColorScheme } from "@/db/schema";

export const SettingsSchema = z
  .object({
    colorScheme: z.nativeEnum(ColorScheme).describe("Color scheme to display."),
  })
  .strict();

export const UpdateableSettingsRequestSchema = SettingsSchema.partial();

export type SettingsResponse = z.infer<typeof SettingsSchema>;
export type UpdatedSettingsRequest = z.infer<
  typeof UpdateableSettingsRequestSchema
>;
export type UpdatedSettingsResponse = z.infer<
  typeof UpdateableSettingsRequestSchema
>;
