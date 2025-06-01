import "zod-openapi/extend";

import { z } from "zod";

export const UpgradeBannerResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

export type UpgradeBannerResponse = z.infer<typeof UpgradeBannerResponseSchema>;
