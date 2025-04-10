import { and, eq, inArray, sql } from "@app/api/db";
import { items, profileItemHighlights, profileItems } from "@app/api/db/schema";
import {
  deleteHighlightDocuments,
  indexHighlightDocuments,
  searchHighlightDocuments,
} from "@app/api/lib/search";
import {
  apiDoc,
  APIResponse,
  describeRoute,
  parseError,
  zValidator,
} from "@app/api/utils/api";
import { EnvBindings } from "@app/api/utils/env";
import log from "@app/api/utils/logger";
import {
  CreateOrUpdateHighlightRequest,
  CreateOrUpdateHighlightRequestSchema,
  CreateOrUpdateHighlightResponse,
  CreateOrUpdateHighlightResponseSchema,
  DeleteHighlightRequest,
  DeleteHighlightRequestSchema,
  DeleteHighlightResponse,
  DeleteHighlightResponseSchema,
  GetHighlightsRequest,
  GetHighlightsRequestSchema,
  GetHighlightsResponse,
  GetHighlightsResponseSchema,
} from "@app/schemas/v1/items/highlights";
import { Hono } from "hono";

export const itemsHighlightRouter = new Hono<EnvBindings>()
  .get(
    "/",
    describeRoute(
      apiDoc("get", GetHighlightsRequestSchema, GetHighlightsResponseSchema),
    ),
    zValidator(
      "query",
      GetHighlightsRequestSchema,
      parseError<GetHighlightsRequest, GetHighlightsResponse>,
    ),
    async (c): Promise<APIResponse<GetHighlightsResponse>> => {
      const profileId = c.get("profileId")!;
      try {
        const { offset, limit, search } = c.req.valid("query");

        const { hits, estimatedTotalHits } = await searchHighlightDocuments(
          c,
          search || "",
          profileId,
          {
            offset,
            limit,
            ...(search ? {} : { sort: ["updatedAt:desc"] }),
          },
        );

        const hasNextPage = estimatedTotalHits > offset + limit;

        const response = GetHighlightsResponseSchema.parse({
          highlights: hits.map((hit) => ({
            id: hit.id,
            text: hit.highlightText,
            note: hit.note,
            startOffset: hit.startOffset,
            endOffset: hit.endOffset,
            updatedAt: hit.updatedAt,
            textExcerpt: hit._formatted?.highlightText,
            noteExcerpt: hit._formatted?.note,
            item: {
              slug: hit.slug,
              url: hit.url,
              metadata: {
                title: hit.title,
                textDirection: hit.textDirection,
                author: hit.author,
              },
            },
          })),
          nextOffset: hasNextPage ? offset + limit : undefined,
          total: estimatedTotalHits,
        });

        return c.json(response);
      } catch (error) {
        log("Error getting highlights", error);
        return c.json({ error: "Internal server error" }, 500);
      }
    },
  )
  .post(
    "/",
    describeRoute(
      apiDoc(
        "post",
        CreateOrUpdateHighlightRequestSchema,
        CreateOrUpdateHighlightResponseSchema,
      ),
    ),
    zValidator(
      "json",
      CreateOrUpdateHighlightRequestSchema,
      parseError<
        CreateOrUpdateHighlightRequest,
        CreateOrUpdateHighlightResponse
      >,
    ),
    async (c): Promise<APIResponse<CreateOrUpdateHighlightResponse>> => {
      const profileId = c.get("profileId")!;
      try {
        const { slug, highlights } = c.req.valid("json");
        if (!slug) {
          return c.json({ error: "No slug provided." }, 400);
        }

        const db = c.get("db");
        const profileItem = await db
          .select({
            id: profileItems.id,
            title: profileItems.title,
            textDirection: profileItems.textDirection,
            author: profileItems.author,
            url: items.url,
          })
          .from(profileItems)
          .innerJoin(items, eq(profileItems.itemId, items.id))
          .where(
            and(eq(profileItems.profileId, profileId), eq(items.slug, slug)),
          )
          .limit(1);

        if (!profileItem.length) {
          return c.json({ error: "Item not found for the given slug" }, 404);
        }

        const highlightsWithProfileItemId = highlights.map((h) => ({
          id: h.id,
          profileItemId: profileItem[0].id,
          startOffset: h.startOffset,
          endOffset: h.endOffset,
          text: h.text,
          note: h.note,
        }));

        const savedHighlights = await db
          .insert(profileItemHighlights)
          .values(highlightsWithProfileItemId)
          .onConflictDoUpdate({
            target: profileItemHighlights.id,
            where: eq(profileItemHighlights.profileItemId, profileItem[0].id),
            set: {
              startOffset: sql`excluded.start_offset`,
              endOffset: sql`excluded.end_offset`,
              text: sql`excluded.text`,
              note: sql`excluded.note`,
              updatedAt: sql`now()`,
            },
          })
          .returning();

        if (savedHighlights.length) {
          await indexHighlightDocuments(
            c,
            savedHighlights.map((h) => ({
              id: h.id,
              profileId,
              profileItemId: h.profileItemId,
              slug: slug,
              url: profileItem[0].url,
              title: profileItem[0].title,
              textDirection: profileItem[0].textDirection,
              author: profileItem[0].author ?? undefined,
              highlightText: h.text || "",
              note: h.note || "",
              startOffset: h.startOffset,
              endOffset: h.endOffset,
              updatedAt: h.updatedAt,
            })),
          );
        }

        const response = CreateOrUpdateHighlightResponseSchema.parse({
          highlights: savedHighlights.map((h) => ({
            id: h.id,
            startOffset: h.startOffset,
            endOffset: h.endOffset,
            text: h.text,
            note: h.note,
            createdAt: h.createdAt,
          })),
        });

        return c.json(response);
      } catch (error) {
        log("Error creating/updating highlights", { error });
        return c.json({ error: "Failed to create/update highlights" }, 500);
      }
    },
  )
  .delete(
    "/",
    describeRoute(
      apiDoc(
        "delete",
        DeleteHighlightRequestSchema,
        DeleteHighlightResponseSchema,
      ),
    ),
    zValidator(
      "json",
      DeleteHighlightRequestSchema,
      parseError<DeleteHighlightRequest, DeleteHighlightResponse>,
    ),
    async (c): Promise<APIResponse<DeleteHighlightResponse>> => {
      const profileId = c.get("profileId")!;
      try {
        const { slug, highlightIds } = c.req.valid("json");

        const db = c.get("db");
        const profileItem = await db
          .select({
            id: profileItems.id,
          })
          .from(profileItems)
          .innerJoin(items, eq(profileItems.itemId, items.id))
          .where(
            and(eq(profileItems.profileId, profileId), eq(items.slug, slug)),
          )
          .limit(1);

        if (!profileItem.length) {
          return c.json({ error: "Item not found for the given slug" }, 404);
        }

        const deletedHighlights = await db
          .delete(profileItemHighlights)
          .where(
            and(
              inArray(profileItemHighlights.id, highlightIds),
              eq(profileItemHighlights.profileItemId, profileItem[0].id),
            ),
          )
          .returning();

        if (deletedHighlights.length) {
          await deleteHighlightDocuments(
            c,
            deletedHighlights.map((h) => h.id),
          );
        }

        const response = DeleteHighlightResponseSchema.parse({
          deleted: deletedHighlights.map((h) => ({ id: h.id })),
        });

        return c.json(response);
      } catch (error) {
        log("Error deleting highlights", { error });
        return c.json({ error: "Failed to delete highlights" }, 500);
      }
    },
  );
