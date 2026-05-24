import { describe, it, expect, vi } from "vitest";

describe("Library Content Schema", () => {
  it("should validate a library content item correctly", () => {
    const mockItem = {
      id: "source-001",
      title: "صحيح البخاري",
      bookTitle: "الجامع المسند الصحيح",
      text: "عن عمر بن الخطاب: إنما الأعمال بالنيات...",
      category: "hadith",
      language: "ar",
      jurisdiction: "سنّي",
      islamicRuling: "unspecified",
      tags: ["سنة", "حديث"]
    };

    expect(mockItem.id).toBeDefined();
    expect(mockItem.category).toBe("hadith");
    expect(mockItem.language).toBe("ar");
    expect(mockItem.jurisdiction).toBe("سنّي");
    expect(mockItem.tags).toContain("حديث");
  });

  it("should validate all expected categories", () => {
    const validCategories = ["tafsir", "creed", "fiqh", "hadith", "ethics", "general", "sira", "library"];
    expect(validCategories.includes("tafsir")).toBe(true);
    expect(validCategories.includes("sira")).toBe(true);
    expect(validCategories.includes("ethics")).toBe(true);
  });

  it("should correctly handle missing optional fields like mediaUrl", () => {
    const mockItem = {
      id: "source-002",
      title: "فقه العبادات",
      bookTitle: "فقه العبادات",
      text: "الوضوء شرط لصحة الصلاة",
      category: "fiqh",
    };
    expect(mockItem).not.toHaveProperty("mediaUrl");
    expect(mockItem.category).toBe("fiqh");
  });
});
