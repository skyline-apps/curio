import { z } from "zod";

import { ItemState } from "@/db/schema";

const UrlSchema = z.string().url().describe("Unique URL of the item.");
const SlugSchema = z
  .string()
  .describe("Unique slug for the item used to identify it in its URL.");
const dateType = z.union([z.string(), z.date()]).transform((val) => {
  if (val instanceof Date) {
    return val.toISOString();
  }
  return val;
});

const FilterSchema = z
  .string()
  .transform((val) => {
    return JSON.parse(val);
  })
  .pipe(
    z
      .object({
        state: z.nativeEnum(ItemState).optional(),
        isFavorite: z.boolean().optional(),
      })
      .strict(),
  );

const ItemMetadataSchema = z
  .object({
    title: z.string().max(255).describe("The title of the item."),
    description: z
      .string()
      .max(2048)
      .nullable()
      .optional()
      .describe("The description of the item."),
    author: z
      .string()
      .max(255)
      .nullable()
      .optional()
      .describe("The author of the item."),
    thumbnail: z
      .string()
      .url()
      .max(2048)
      .nullable()
      .optional()
      .describe("The thumbnail URL of the item."),
    favicon: z
      .string()
      .url()
      .max(2048)
      .nullable()
      .optional()
      .describe("The favicon URL of the item."),
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
    stateUpdatedAt: dateType
      .nullable()
      .optional()
      .describe(
        "The time the item's state was last updated. Used to sort items in the feed.",
      ),
    state: z
      .nativeEnum(ItemState)
      .describe("Whether the state is active or archived."),
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
  })
  .strict();

export const ItemResultSchema = z
  .object({
    id: z.string(),
    url: UrlSchema,
    slug: SlugSchema,
    metadata: ItemMetadataSchema,
    createdAt: dateType,
  })
  .strict();

export type ItemResult = z.infer<typeof ItemResultSchema>;

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
    limit: z.coerce.number().min(1).max(1000).optional().default(100),
    cursor: z
      .string()
      .optional()
      .describe("The savedAt timestamp to start from."),
    filters: FilterSchema.optional().describe("The filters to apply."),
    search: z
      .string()
      .max(100)
      .optional()
      .describe("The search query to apply."),
  })
  .refine(
    (val) => !(val.slugs && val.urls),
    "Cannot provide both slugs and urls",
  );
export type GetItemsRequest = Partial<z.infer<typeof GetItemsRequestSchema>> & {
  limit?: number;
};

export const GetItemsResponseSchema = z.object({
  items: z.array(ItemResultSchema),
  nextCursor: z.string().optional(),
  total: z.number(),
});
export type GetItemsResponse = z.infer<typeof GetItemsResponseSchema>;

export const CreateOrUpdateItemsRequestSchema = z.object({
  items: z.array(
    z
      .object({
        url: UrlSchema,
        metadata: ItemMetadataSchema.partial().optional(),
      })
      .strict(),
  ),
});

export type CreateOrUpdateItemsRequest = z.infer<
  typeof CreateOrUpdateItemsRequestSchema
>;

export const CreateOrUpdateItemsResponseSchema = z.object({
  items: z.array(ItemResultSchema),
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
