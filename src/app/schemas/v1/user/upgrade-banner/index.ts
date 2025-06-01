import "zod-openapi/extend";

import { z } from "zod";

export const UpgradeBannerRequestSchema = z.object({});

export const UpgradeBannerResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

export type UpgradeBannerRequest = z.infer<typeof UpgradeBannerRequestSchema>;
export type UpgradeBannerResponse = z.infer<typeof UpgradeBannerResponseSchema>;
