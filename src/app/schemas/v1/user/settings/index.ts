import "zod-openapi/extend";

import { ColorScheme, DisplayFont, DisplayFontSize } from "@app/schemas/db";
import { z } from "zod";

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
  completedWalkthrough: z
    .boolean()
    .describe("Whether you've completed the product walkthrough."),
  analyticsTracking: z
    .boolean()
    .describe(
      "Send usage data and product analytics to help improve our service.",
    ),
});

export const UpdateableSettingsSchema = SettingsSchema.strict().partial();

export const GetSettingsRequestSchema = z.object({});
export type GetSettingsRequest = z.infer<typeof GetSettingsRequestSchema>;

export const GetSettingsResponseSchema = SettingsSchema;
export type GetSettingsResponse = z.infer<typeof GetSettingsResponseSchema>;

export const UpdateSettingsRequestSchema = UpdateableSettingsSchema;
export type UpdateSettingsRequest = z.infer<typeof UpdateSettingsRequestSchema>;
export const UpdateSettingsResponseSchema = UpdateableSettingsSchema;
export type UpdateSettingsResponse = z.infer<
  typeof UpdateSettingsResponseSchema
>;
