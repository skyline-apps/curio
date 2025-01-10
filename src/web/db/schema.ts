// eslint-disable-next-line no-restricted-imports
import {
  boolean,
  foreignKey,
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
    title: text("title"),
    description: text("description"),
    author: text("author"),
    thumbnail: text("thumbnail"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
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

export const itemState = pgEnum("item_state", ["active", "archived"]);

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
    state: itemState("state").notNull().default("active"),
    isFavorite: boolean("is_favorite").notNull().default(false),
    readingProgress: integer("reading_progress").notNull().default(0),
    savedAt: timestamp("saved_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    lastReadAt: timestamp("last_read_at", { withTimezone: true }),
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

export type InsertProfile = typeof profiles.$inferInsert;
export type SelectProfile = typeof profiles.$inferSelect;
export type InsertItem = typeof items.$inferInsert;
export type InsertProfileLabel = typeof profileLabels.$inferInsert;
export type InsertProfileItem = typeof profileItems.$inferInsert;
export type InsertProfileItemLabel = typeof profileItemLabels.$inferInsert;
