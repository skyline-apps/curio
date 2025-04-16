import { z } from "zod";

export const InstapaperBookmarkSchema = z.object({
  type: z.literal("bookmark"),
  bookmark_id: z.number(),
  url: z.string().url(),
  title: z.string(),
  description: z.string(),
  time: z.number().describe("UNIX timestamp"),
  starred: z.enum(["0", "1"]),
  tags: z.array(z.object({ id: z.number(), name: z.string() })),
  private_source: z.string().optional(),
  hash: z.string(),
  progress: z.number(),
  progress_timestamp: z.number(),
});

export type InstapaperBookmark = z.infer<typeof InstapaperBookmarkSchema>;
