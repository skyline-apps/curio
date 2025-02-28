import { z } from "zod";

import {
  ItemResultSchema,
  PublicItemResultSchema,
} from "@/app/api/v1/items/validation";
import { RecommendationSectionType } from "@/db/schema";

export const RecommendationSectionSchema = z.object({
  section: z.nativeEnum(RecommendationSectionType),
  items: z.array(z.union([ItemResultSchema, PublicItemResultSchema])),
});

export type RecommendationSection = z.infer<typeof RecommendationSectionSchema>;

export const GetRecommendationsRequestSchema = z.object({});

export type GetRecommendationsRequest = z.infer<
  typeof GetRecommendationsRequestSchema
>;

export const GetRecommendationsResponseSchema = z.object({
  recommendations: z.array(RecommendationSectionSchema),
});

export type GetRecommendationsResponse = z.infer<
  typeof GetRecommendationsResponseSchema
>;
