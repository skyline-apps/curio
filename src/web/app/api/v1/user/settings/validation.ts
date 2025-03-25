import { z } from "zod";

import { ColorScheme, DisplayFont, DisplayFontSize } from "@web/db/schema";

export const SettingsSchema = z.object({
  colorScheme: z.nativeEnum(ColorScheme).describe("Color scheme to display."),
  displayFont: z
    .nativeEnum(DisplayFont)
    .describe("Typeface to use for reading."),
  displayFontSize: z
    .nativeEnum(DisplayFontSize)
    .describe("Font size to use for reading."),
  public: z
    .boolean()
    .describe("Whether your profile and favorited items are public."),
  analyticsTracking: z
    .boolean()
    .describe(
      "Send usage data and product analytics to help improve our service.",
    ),
});

export const UpdateableSettingsSchema = SettingsSchema.strict().partial();

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
