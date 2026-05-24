import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFavorites } from "../src/hooks/useFavorites";

// Mock supabase sync to avoid external network calls during tests
vi.mock("../src/lib/supabase", () => ({
  syncFavoritesWithCloud: vi.fn(),
  supabase: null,
}));

const mockFavoritesStore = {
  hub_favorites: [] as string[],
};

vi.mock("@/lib/db", () => ({
  localDB: {
    getGeneralProgress: vi.fn((key, defaultValue) => {
      if (key === "hub_favorites") {
        return mockFavoritesStore.hub_favorites;
      }
      return defaultValue;
    }),
    saveGeneralProgress: vi.fn((key, value) => {
      if (key === "hub_favorites") {
        mockFavoritesStore.hub_favorites = value;
      }
    }),
  },
}));

describe("useFavorites Hook", () => {
  beforeEach(() => {
    mockFavoritesStore.hub_favorites = [];
    vi.clearAllMocks();
  });

  it("initializes with empty favorites if localDB is empty", () => {
    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites).toEqual([]);
    expect(result.current.isFavorite("item-1")).toBe(false);
  });

  it("loads existing favorites from localDB", () => {
    mockFavoritesStore.hub_favorites = ["item-1", "item-2"];
    const { result } = renderHook(() => useFavorites());

    expect(result.current.favorites).toEqual(["item-1", "item-2"]);
    expect(result.current.isFavorite("item-1")).toBe(true);
    expect(result.current.isFavorite("item-3")).toBe(false);
  });

  it("toggles favorite items correctly", () => {
    const { result } = renderHook(() => useFavorites());

    // Add item-1
    act(() => {
      result.current.toggleFavorite("item-1");
    });
    expect(result.current.favorites).toEqual(["item-1"]);
    expect(result.current.isFavorite("item-1")).toBe(true);
    expect(mockFavoritesStore.hub_favorites).toEqual(["item-1"]);

    // Add item-2
    act(() => {
      result.current.toggleFavorite("item-2");
    });
    expect(result.current.favorites).toEqual(["item-1", "item-2"]);

    // Remove item-1
    act(() => {
      result.current.toggleFavorite("item-1");
    });
    expect(result.current.favorites).toEqual(["item-2"]);
    expect(result.current.isFavorite("item-1")).toBe(false);
    expect(mockFavoritesStore.hub_favorites).toEqual(["item-2"]);
  });
});
