import { and, eq, sql, TransactionDB } from "@app/api/db";
import { fetchOwnItemResults } from "@app/api/db/dal/profileItems";
import { items, profileItemHighlights, profileItems } from "@app/api/db/schema";
import { getItemContent, getItemMetadata } from "@app/api/lib/storage";
import { StorageError, VersionMetadata } from "@app/api/lib/storage/types";
import {
  apiDoc,
  APIResponse,
  describeRoute,
  parseError,
  zValidator,
} from "@app/api/utils/api";
import { EnvBindings, EnvContext } from "@app/api/utils/env";
import {
  GetItemContentRequest,
  GetItemContentRequestSchema,
  GetItemContentResponse,
  GetItemContentResponseSchema,
  ItemResultWithHighlightsSchema,
} from "@app/schemas/v1/public/items/content";
import { Hono } from "hono";

async function getDefaultContent(
  c: EnvContext,
  db: TransactionDB,
  slug: string,
): Promise<APIResponse<GetItemContentResponse>> {
  const log = c.get("log");
  const itemResult = await db
    .select({
      id: items.id,
      url: items.url,
      slug: items.slug,
      createdAt: items.createdAt,
    })
    .from(items)
    .where(eq(items.slug, slug))
    .limit(1);

  if (!itemResult.length) {
    return c.json({ error: "Item not found." }, 404);
  }

  let metadata: VersionMetadata;

  try {
    metadata = await getItemMetadata(c, slug);
  } catch (error: unknown) {
    if (error instanceof StorageError) {
      log.warn("Error fetching metadata for item", {
        slug,
        error: error.message,
      });
      return c.json({ error: "Item not found." }, 404);
    } else {
      throw error;
    }
  }

  try {
    const { content } = await getItemContent(c, slug, null);

    const response = GetItemContentResponseSchema.parse({
      content,
      item: {
        id: itemResult[0].id,
        slug: itemResult[0].slug,
        url: itemResult[0].url,
        createdAt: itemResult[0].createdAt,
        profileItemId: null,
        metadata: {
          title: metadata.title,
          description: metadata.description,
          publishedAt: metadata.publishedAt,
          thumbnail: metadata.thumbnail,
          favicon: metadata.favicon,
          textDirection: metadata.textDirection,
          textLanguage: metadata.textLanguage,
          savedAt: metadata.timestamp,
        },
      },
    });

    return c.json(response);
  } catch (error: unknown) {
    if (error instanceof StorageError) {
      log.warn("Error fetching default content, returning item info", {
        slug,
        error: error.message,
      });
      return c.json(
        GetItemContentResponseSchema.parse({
          item: {
            id: itemResult[0].id,
            slug: itemResult[0].slug,
            url: itemResult[0].url,
            createdAt: itemResult[0].createdAt,
            profileItemId: null,
            metadata,
          },
        }),
        200,
      );
    } else {
      throw error;
    }
  }
}

export const publicItemsContentRouter = new Hono<EnvBindings>().get(
  "/",
  describeRoute(
    apiDoc("get", GetItemContentRequestSchema, GetItemContentResponseSchema),
  ),
  zValidator(
    "query",
    GetItemContentRequestSchema,
    parseError<GetItemContentRequest, GetItemContentResponse>,
  ),
  async (c): Promise<APIResponse<GetItemContentResponse>> => {
    const log = c.get("log");
    const profileId = c.get("profileId");

    const { slug } = c.req.valid("query");

    try {
      const db = c.get("db");

      if (!profileId) {
        return getDefaultContent(c, db, slug);
      }

      const item = await fetchOwnItemResults(db, {
        highlights: sql<
          Array<{
            id: string;
            startOffset: number;
            endOffset: number;
            text: string | null;
            note: string | null;
          }>
        >`(
          SELECT COALESCE(
            json_agg(
              json_build_object(
                'id', h.id,
                'startOffset', h.start_offset,
                'endOffset', h.end_offset,
                'text', h.text,
                'note', h.note
              ) ORDER BY h.start_offset
            ),
            '[]'::json
          )
          FROM ${profileItemHighlights} h
          WHERE h.profile_item_id = ${profileItems.id}
        )`,
      })
        .where(and(eq(items.slug, slug), eq(profileItems.profileId, profileId)))
        .limit(1);

      if (!item.length) {
        return getDefaultContent(c, db, slug);
      }

      const itemResponse = ItemResultWithHighlightsSchema.parse(item[0]);

      try {
        const { version, content } = await getItemContent(
          c,
          slug,
          itemResponse.metadata.versionName,
        );

        let response: GetItemContentResponse =
          GetItemContentResponseSchema.parse({
            content,
            item: itemResponse,
          });
        // Clear out versionName if it can't be found.
        if (version !== itemResponse.metadata.versionName) {
          await db
            .update(profileItems)
            .set({ versionName: version })
            .where(
              and(
                eq(profileItems.itemId, itemResponse.id),
                eq(profileItems.profileId, profileId),
              ),
            )
            .returning({
              id: profileItems.id,
            });

          response = GetItemContentResponseSchema.parse({
            content,
            item: {
              ...itemResponse,
              metadata: { ...itemResponse.metadata, versionName: version },
            },
          });
        }
        return c.json(response);
      } catch (error: unknown) {
        // Still return metadata if content can't be loaded
        if (error instanceof StorageError) {
          log.warn("Error fetching default content, returning item info", {
            profileId,
            slug,
            error: error.message,
          });
          return c.json(
            GetItemContentResponseSchema.parse({ item: itemResponse }),
            200,
          );
        } else {
          throw error;
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        log.error("Error getting item content", { error, slug, profileId });
        return c.json({ error: "Error getting item content." }, 500);
      } else {
        log.error("Unknown error getting item content", {
          error,
          slug,
          profileId,
        });
        return c.json({ error: "Unknown error getting item content." }, 500);
      }
    }
  },
);
