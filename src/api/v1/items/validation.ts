import "zod-openapi/extend";

import { ItemSource, ItemState, TextDirection } from "@api/db/schema";
import { LabelSchema } from "@api/v1/user/labels/validation";
import { z } from "zod";

const UrlSchema = z.string().url().describe("Unique URL of the item.");
const SlugSchema = z
  .string()
  .describe("Unique slug for the item used to identify it in its URL.");
const dateType = z
  .union([z.string(), z.date()])
  .transform((val) => {
    if (val instanceof Date) {
      return val.toISOString();
    }
    return val;
  })
  .pipe(z.string());

const FiltersSchema = z
  .string()
  .transform((val) => {
    return JSON.parse(val);
  })
  .pipe(
    z
      .object({
        state: z.nativeEnum(ItemState).optional(),
        isFavorite: z.boolean().optional(),
        labels: z
          .object({
            operator: z.enum(["and", "or"]).optional().default("or"),
            ids: z
              .array(z.string())
              .describe(
                "A list of label IDs to retrieve. If a label is not found, it will be ignored.",
              ),
          })
          .optional(),
      })
      .strict(),
  );

export type Filters = z.infer<typeof FiltersSchema>;

export const PublicItemMetadataSchema = z.object({
  title: z.string().describe("The title of the item."),
  description: z
    .string()
    .nullable()
    .optional()
    .describe("The description of the item."),
  author: z.string().nullable().optional().describe("The author of the item."),
  publishedAt: dateType
    .nullable()
    .optional()
    .describe("The published date of the item."),
  savedAt: dateType
    .nullable()
    .optional()
    .describe(
      "The time the item was saved. Populated automatically and cannot be user-overridden.",
    ),
  textDirection: z
    .nativeEnum(TextDirection)
    .describe("The text direction of the item."),
  textLanguage: z
    .string()
    .max(10)
    .nullable()
    .describe("The language of the item."),
});

const ItemMetadataBaseSchema = PublicItemMetadataSchema.merge(
  z.object({
    stateUpdatedAt: dateType
      .nullable()
      .optional()
      .describe(
        "The time the item's state was last updated. Used to sort items in the feed.",
      ),
    state: z
      .nativeEnum(ItemState)
      .describe("Whether the state is active or archived."),
    source: z
      .nativeEnum(ItemSource)
      .nullable()
      .describe("Where the item was saved from."),
    isFavorite: z.boolean().describe("Whether the item is favorited."),
    readingProgress: z
      .number()
      .min(0)
      .max(100)
      .describe(
        "Progress reading the item. Should only populated if versionName is set.",
      ),
    lastReadAt: dateType
      .nullable()
      .optional()
      .describe(
        "The last read date of the item. Should only be populated if versionName is set.",
      ),
    versionName: z
      .string()
      .max(255)
      .nullable()
      .describe("The version name of the item."),
  }),
);

export const ItemImagesSchema = z.object({
  thumbnail: z
    .string()
    .nullable()
    .optional()
    .transform((val) => {
      if (!val) return null;
      try {
        return val ? new URL(val).toString() : null;
      } catch {
        return null;
      }
    })
    .pipe(z.string().url().nullable())
    .describe("The thumbnail URL of the item."),
  favicon: z
    .string()
    .nullable()
    .optional()
    .transform((val) => {
      if (!val) return null;
      try {
        return val ? new URL(val).toString() : null;
      } catch {
        return null;
      }
    })
    .pipe(z.string().url().nullable())
    .describe("The favicon URL of the item."),
});

const ItemMetadataSchema = ItemMetadataBaseSchema.merge(ItemImagesSchema);

export const ItemResultSchema = z.object({
  id: z.string(),
  profileItemId: z.string(),
  url: UrlSchema,
  slug: SlugSchema,
  metadata: ItemMetadataSchema,
  createdAt: dateType,
  labels: z.array(LabelSchema),
  excerpt: z
    .string()
    .optional()
    .describe("Included if the item is relevant for the search query"),
});

export type ItemResult = z.infer<typeof ItemResultSchema>;

export const PublicItemResultSchema = ItemResultSchema.extend({
  profileItemId: z.null(),
  labels: z.array(LabelSchema).optional(),
  metadata: PublicItemMetadataSchema.merge(ItemImagesSchema),
});

export type PublicItemResult = z.infer<typeof PublicItemResultSchema>;

export const ItemResultWithoutLabelsSchema = ItemResultSchema.omit({
  labels: true,
});

export const GetItemsRequestSchema = z
  .object({
    slugs: z
      .string()
      .optional()
      .transform((val) =>
        val ? val.split(",").map((s) => s.trim()) : undefined,
      )
      .refine(
        (val) => !val || val.every((s) => s.length > 0),
        "Invalid slug format",
      )
      .describe(
        "A comma-separated list of slugs to retrieve. If the slug is not found, it will be ignored.",
      ),
    urls: z
      .string()
      .optional()
      .transform((val) =>
        val ? val.split(",").map((s) => s.trim()) : undefined,
      )
      .refine(
        (val) => !val || val.every((s) => s.length > 0),
        "Invalid URL format",
      )
      .describe(
        "A comma-separated list of URLs to retrieve. If the URL is not found, it will be ignored.",
      ),
    limit: z.coerce.number().min(1).max(1000).optional().default(20),
    cursor: z
      .string()
      .optional()
      .describe("The stateUpdatedAt timestamp to start from."),
    offset: z.coerce
      .number()
      .min(0)
      .optional()
      .describe("The search result offset to start from.")
      .default(0),
    filters: FiltersSchema.optional().describe("The filters to apply."),
    search: z.string().optional().describe("The search query to apply."),
  })
  .refine(
    (val) => [val.slugs, val.urls, val.search].filter(Boolean).length <= 1,
    "Can provide at most one of slugs, urls, or search",
  );
export type GetItemsRequest = Partial<z.infer<typeof GetItemsRequestSchema>> & {
  limit?: number;
};

export const GetItemsResponseSchema = z
  .object({
    items: z.array(ItemResultSchema),
    nextCursor: z.string().optional(),
    nextOffset: z.number().optional(),
    total: z
      .number()
      .describe(
        "Total results count. May be incorrect if search term is included.",
      ),
  })
  .refine(
    (val) => !(val.nextCursor && val.nextOffset),
    "Cannot have both nextCursor and nextOffset",
  );
export type GetItemsResponse = z.infer<typeof GetItemsResponseSchema>;

const ItemMetadataUpdateSchema = ItemMetadataSchema.merge(
  z.object({
    thumbnail: z
      .string()
      .url()
      .nullable()
      .optional()
      .describe("The thumbnail URL of the item."),
    favicon: z
      .string()
      .url()
      .nullable()
      .optional()
      .describe("The favicon URL of the item."),
  }),
).strict();

export const CreateOrUpdateItemsRequestSchema = z.object({
  items: z.array(
    z
      .object({
        url: UrlSchema,
        metadata: ItemMetadataUpdateSchema.partial().optional(),
      })
      .strict(),
  ),
});

export type CreateOrUpdateItemsRequest = z.infer<
  typeof CreateOrUpdateItemsRequestSchema
>;

export const CreateOrUpdateItemsResponseSchema = z.object({
  items: z.array(ItemResultWithoutLabelsSchema),
  errors: z
    .array(
      z.object({
        url: z.string(),
        error: z.string(),
      }),
    )
    .optional(),
});

export type CreateOrUpdateItemsResponse = z.infer<
  typeof CreateOrUpdateItemsResponseSchema
>;
