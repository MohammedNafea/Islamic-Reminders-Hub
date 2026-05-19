import { pgTable, uuid, text, timestamp, jsonb, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const userFavoritesTable = pgTable("user_favorites", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  itemId: text("item_id").notNull(),
  type: text("type").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  unique("user_favorites_user_id_item_id_unique").on(table.userId, table.itemId),
]);

export type InsertUserFavorite = typeof userFavoritesTable.$inferInsert;
export type UserFavorite = typeof userFavoritesTable.$inferSelect;
