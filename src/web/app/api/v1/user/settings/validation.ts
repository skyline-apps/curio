import { z } from "zod";

import { ColorScheme } from "@/db/schema";

export const SettingsSchema = z
  .object({
    colorScheme: z.nativeEnum(ColorScheme).describe("Color scheme to display."),
  })
  .strict();

export const UpdateableSettingsSchema = SettingsSchema.partial();

export type Settings = z.infer<typeof SettingsSchema>;
export type UpdatedSettings = z.infer<typeof UpdateableSettingsSchema>;
