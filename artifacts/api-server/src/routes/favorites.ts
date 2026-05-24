import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { userFavoritesTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import {
  CreateFavoriteRequest,
  DeleteFavoriteRequest,
  GetFavoritesRequest,
  FavoriteResponse,
  FavoritesListResponse,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// GET /api/favorites?userId=... — List user favorites
router.get("/favorites", async (req, res) => {
  const parsed = GetFavoritesRequest.safeParse({ userId: req.query.userId });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid userId", details: parsed.error.flatten() });
    return;
  }

  try {
    const { userId } = parsed.data;
    const rows = await db
      .select()
      .from(userFavoritesTable)
      .where(eq(userFavoritesTable.userId, userId));

    const favorites = rows.map((row) =>
      FavoriteResponse.parse({
        id: row.id,
        userId: row.userId,
        itemId: row.itemId,
        type: row.type,
        metadata: row.metadata,
        createdAt: row.createdAt.toISOString(),
      })
    );

    const data = FavoritesListResponse.parse({ favorites });
    res.json(data);
  } catch (err) {
    logger.error(err, "Failed to fetch favorites");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/favorites — Create one or more favorites
router.post("/favorites", async (req, res) => {
  const parsed = CreateFavoriteRequest.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.flatten() });
    return;
  }

  try {
    const { userId, items } = parsed.data;
    const values = items.map((item) => ({
      userId,
      itemId: item.itemId,
      type: item.type,
      metadata: item.metadata ?? null,
    }));

    const rows = await db
      .insert(userFavoritesTable)
      .values(values)
      .onConflictDoNothing()
      .returning();

    const favorites = rows.map((row) =>
      FavoriteResponse.parse({
        id: row.id,
        userId: row.userId,
        itemId: row.itemId,
        type: row.type,
        metadata: row.metadata,
        createdAt: row.createdAt.toISOString(),
      })
    );

    res.status(201).json(FavoritesListResponse.parse({ favorites }));
  } catch (err) {
    logger.error(err, "Failed to create favorites");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/favorites — Delete a favorite by userId + itemId
router.delete("/favorites", async (req, res) => {
  const parsed = DeleteFavoriteRequest.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.flatten() });
    return;
  }

  try {
    const { userId, itemId } = parsed.data;
    await db
      .delete(userFavoritesTable)
      .where(
        and(
          eq(userFavoritesTable.userId, userId),
          eq(userFavoritesTable.itemId, itemId)
        )
      );

    res.json({ deleted: true });
  } catch (err) {
    logger.error(err, "Failed to delete favorite");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
