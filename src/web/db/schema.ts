// eslint-disable-next-line no-restricted-imports
import {
  foreignKey,
  pgEnum,
  pgSchema,
  pgTable,
  text,
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
  },
  (table) => ({
    usernameIndex: uniqueIndex("username_index").on(table.username),
    userForeignKey: foreignKey({
      columns: [table.userId],
      foreignColumns: [authUsers.id],
    }),
  }),
);

export type InsertProfile = typeof profiles.$inferInsert;
export type SelectProfile = typeof profiles.$inferSelect;
