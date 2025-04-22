import { z } from "zod";

export enum ColorScheme {
  AUTO = "auto",
  LIGHT = "light",
  DARK = "dark",
}

export enum DisplayFont {
  MONO = "monospace",
  SANS = "sans-serif",
  SERIF = "serif",
}

export enum DisplayFontSize {
  SM = "sm",
  MD = "md",
  LG = "lg",
  XL = "xl",
}

export enum ItemState {
  ACTIVE = "active",
  ARCHIVED = "archived",
  DELETED = "deleted",
}

export enum ItemSource {
  EMAIL = "email",
  OMNIVORE = "omnivore",
  INSTAPAPER = "instapaper",
}

export enum TextDirection {
  LTR = "ltr",
  RTL = "rtl",
  AUTO = "auto",
}

export enum RecommendationType {
  POPULAR = "popular",
}

export enum PersonalRecommendationType {
  NEWSLETTER = "newsletter",
  FAVORITE_AUTHOR = "favorite_author",
  FAVORITES = "favorites",
}

export enum JobStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
}

export enum JobType {
  IMPORT_INSTAPAPER = "import_instapaper",
  IMPORT_OMNIVORE = "import_omnivore",
}

export const OAuth1TokenSchema = z.object({
  oauth_token: z.string().min(1),
  oauth_token_secret: z.string().min(1),
});

export enum ImportStatus {
  NOT_STARTED = "not_started",
  FETCHED_ITEMS = "fetched_items",
}

export const ImportMetadataSchema = z.object({
  status: z.nativeEnum(ImportStatus),
  totalItems: z.number().optional(),
  processedItems: z.number().optional(),
});

export type ImportMetadata = z.infer<typeof ImportMetadataSchema>;

export const ImportInstapaperMetadataSchema = ImportMetadataSchema.extend({
  accessToken: OAuth1TokenSchema,
});

export const ImportOmnivoreMetadataSchema = ImportMetadataSchema.extend({
  storageKey: z.string().min(1),
});

export const InstapaperProfileItemMetadataSchema = z.object({
  bookmarkId: z.number(),
});

export const OmnivoreProfileItemMetadataSchema = z.object({
  omnivoreSlug: z.string(),
});
