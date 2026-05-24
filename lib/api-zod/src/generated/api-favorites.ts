import * as zod from "zod";

export const FavoriteItemSchema = zod.object({
  itemId: zod.string().min(1),
  type: zod.string().min(1),
  metadata: zod.record(zod.unknown()).optional(),
});

export const CreateFavoriteRequest = zod.object({
  userId: zod.string().uuid(),
  items: zod.array(FavoriteItemSchema).min(1),
});

export const DeleteFavoriteRequest = zod.object({
  userId: zod.string().uuid(),
  itemId: zod.string().min(1),
});

export const GetFavoritesRequest = zod.object({
  userId: zod.string().uuid(),
});

export const FavoriteResponse = zod.object({
  id: zod.string().uuid(),
  userId: zod.string().uuid(),
  itemId: zod.string(),
  type: zod.string(),
  metadata: zod.record(zod.unknown()).nullable(),
  createdAt: zod.string(),
});

export const FavoritesListResponse = zod.object({
  favorites: zod.array(FavoriteResponse),
});
