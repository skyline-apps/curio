// eslint-disable-next-line no-restricted-imports
import {
  boolean,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgSchema,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const authSchema = pgSchema("auth");

// Incomplete table definition for auth.users, which is managed by Supabase.
const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
});

export enum ColorScheme {
  AUTO = "auto",
  LIGHT = "light",
  DARK = "dark",
}
export const colorSchemeEnum = pgEnum("color_scheme", [
  ColorScheme.AUTO,
  ColorScheme.LIGHT,
  ColorScheme.DARK,
]);

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    username: text("username").notNull().unique(),
    userId: uuid("user_id").notNull(),
    colorScheme: colorSchemeEnum("color_scheme")
      .notNull()
      .default(ColorScheme.AUTO),
    public: boolean("public").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    usernameIndex: uniqueIndex("username_index").on(table.username),
    userForeignKey: foreignKey({
      columns: [table.userId],
      foreignColumns: [authUsers.id],
    }),
  }),
);

export const items = pgTable(
  "items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    url: text("url").notNull().unique(),
    slug: text("slug").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    urlIndex: uniqueIndex("url_index").on(table.url),
  }),
);

export enum ItemState {
  ACTIVE = "active",
  ARCHIVED = "archived",
  DELETED = "deleted",
}
export const itemState = pgEnum("item_state", [
  ItemState.ACTIVE,
  ItemState.ARCHIVED,
  ItemState.DELETED,
]);

// Keep this in sync with the mapping in `0016_add app_config and search triggers.sql`
export const ItemStateNumber = {
  [ItemState.ACTIVE]: 1,
  [ItemState.ARCHIVED]: 2,
  [ItemState.DELETED]: 3,
};

export const profileLabels = pgTable(
  "profile_labels",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id").notNull(),
    name: text("name").notNull(),
    color: text("color").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    profileForeignKey: foreignKey({
      name: "profile_labels_profile_id_fk",
      columns: [table.profileId],
      foreignColumns: [profiles.id],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    uniqueProfileLabel: uniqueIndex("unique_profile_label").on(
      table.profileId,
      table.name,
    ),
  }),
);

export const profileItems = pgTable(
  "profile_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id").notNull(),
    itemId: uuid("item_id").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    author: text("author"),
    thumbnail: text("thumbnail"),
    favicon: text("favicon"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    state: itemState("state").notNull().default(ItemState.ACTIVE),
    isFavorite: boolean("is_favorite").notNull().default(false),
    readingProgress: integer("reading_progress").notNull().default(0),
    savedAt: timestamp("saved_at", { withTimezone: true }),
    stateUpdatedAt: timestamp("state_updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    lastReadAt: timestamp("last_read_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    versionName: text("version_name"),
  },
  (table) => ({
    profileForeignKey: foreignKey({
      name: "profile_items_profile_id_fk",
      columns: [table.profileId],
      foreignColumns: [profiles.id],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    itemForeignKey: foreignKey({
      name: "profile_items_item_id_fk",
      columns: [table.itemId],
      foreignColumns: [items.id],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    uniqueProfileItem: uniqueIndex("unique_profile_item").on(
      table.profileId,
      table.itemId,
    ),
  }),
);

export const profileItemLabels = pgTable(
  "profile_item_labels",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileItemId: uuid("profile_item_id").notNull(),
    labelId: uuid("label_id").notNull(),
  },
  (table) => ({
    profileItemForeignKey: foreignKey({
      name: "profile_item_labels_profile_item_id_fk",
      columns: [table.profileItemId],
      foreignColumns: [profileItems.id],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    labelForeignKey: foreignKey({
      name: "profile_item_labels_label_id_fk",
      columns: [table.labelId],
      foreignColumns: [profileLabels.id],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    uniqueProfileItemLabel: uniqueIndex("unique_profile_item_label").on(
      table.profileItemId,
      table.labelId,
    ),
  }),
);

export const profileItemHighlights = pgTable(
  "profile_item_highlights",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileItemId: uuid("profile_item_id").notNull(),
    startOffset: integer("start_offset").notNull(),
    endOffset: integer("end_offset").notNull(),
    text: text("text"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    profileItemForeignKey: foreignKey({
      name: "profile_item_highlights_profile_item_id_fk",
      columns: [table.profileItemId],
      foreignColumns: [profileItems.id],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  }),
);

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    key: text("key").notNull().unique(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    lastUsedAt: timestamp("last_used_at"),
    expiresAt: timestamp("expires_at"),
    isActive: boolean("is_active").default(true).notNull(),
  },
  (table) => ({
    profileIdIdx: index("api_keys_profile_id_idx").on(table.profileId),
    keyIdx: uniqueIndex("api_keys_key_idx").on(table.key),
  }),
);

export const appConfig = pgTable("app_config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export enum RecommendationSectionType {
  POPULAR = "popular",
  NEWSLETTER = "newsletter",
  FAVORITE_AUTHOR = "favorite_author",
  FAVORITES = "favorites",
}

export const recommendationSectionType = pgEnum("recommendation_section_type", [
  RecommendationSectionType.POPULAR,
  RecommendationSectionType.NEWSLETTER,
  RecommendationSectionType.FAVORITE_AUTHOR,
  RecommendationSectionType.FAVORITES,
]);

export const profileItemRecommendations = pgTable(
  "profile_item_recommendations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id").notNull(),
    itemId: uuid("item_id").notNull(),
    profileItemId: uuid("profile_item_id"),
    sectionType: recommendationSectionType("section_type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    profileForeignKey: foreignKey({
      name: "profile_item_recommendations_profile_id_fk",
      columns: [table.profileId],
      foreignColumns: [profiles.id],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    itemForeignKey: foreignKey({
      name: "profile_item_recommendations_item_id_fk",
      columns: [table.itemId],
      foreignColumns: [items.id],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    profileItemForeignKey: foreignKey({
      name: "profile_item_recommendations_profile_item_id_fk",
      columns: [table.profileItemId],
      foreignColumns: [profileItems.id],
    })
      .onDelete("set null")
      .onUpdate("cascade"),
    uniqueProfileSectionItem: uniqueIndex("unique_profile_section_item").on(
      table.profileId,
      table.sectionType,
      table.itemId,
    ),
  }),
);

export type InsertProfile = typeof profiles.$inferInsert;
export type SelectProfile = typeof profiles.$inferSelect;
export type InsertItem = typeof items.$inferInsert;
export type InsertProfileLabel = typeof profileLabels.$inferInsert;
export type InsertProfileItem = typeof profileItems.$inferInsert;
export type InsertProfileItemLabel = typeof profileItemLabels.$inferInsert;
export type InsertApiKey = typeof apiKeys.$inferInsert;
export type SelectApiKey = typeof apiKeys.$inferSelect;
export type InsertProfileItemRecommendation =
  typeof profileItemRecommendations.$inferInsert;
