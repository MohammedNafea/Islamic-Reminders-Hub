import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFavorites } from "../src/hooks/useFavorites";

// Mock supabase sync to avoid external network calls during tests
vi.mock("../src/lib/supabase", () => ({
  syncFavoritesWithCloud: vi.fn(),
  supabase: null,
}));

describe("useFavorites Hook", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("initializes with empty favorites if localStorage is empty", () => {
    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites).toEqual([]);
    expect(result.current.isFavorite("item-1")).toBe(false);
  });

  it("loads existing favorites from localStorage", () => {
    localStorage.setItem("hub_favorites", JSON.stringify(["item-1", "item-2"]));
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
    expect(JSON.parse(localStorage.getItem("hub_favorites")!)).toEqual(["item-1"]);

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
    expect(JSON.parse(localStorage.getItem("hub_favorites")!)).toEqual(["item-2"]);
  });
});
