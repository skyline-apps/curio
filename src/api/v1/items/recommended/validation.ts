import "zod-openapi/extend";

import { PersonalRecommendationType, RecommendationType } from "@api/db/schema";
import {
  ItemResultSchema,
  PublicItemResultSchema,
} from "@api/v1/items/validation";
import { z } from "zod";

export const RecommendationSectionSchema = z.object({
  sectionType: z
    .nativeEnum(PersonalRecommendationType)
    .or(z.nativeEnum(RecommendationType)),
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
