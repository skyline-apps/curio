import {
  ItemResultSchema,
  PublicItemResultSchema,
} from "@web/app/api/v1/items/validation";
import { PersonalRecommendationType, RecommendationType } from "@web/db/schema";
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
