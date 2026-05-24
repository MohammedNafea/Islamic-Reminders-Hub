import { describe, it, expect } from "vitest";
import { IntelligentProcessor } from "../src/lib/intelligent-processor";
import type { LibraryContentItem } from "../src/types/library";

describe("Intelligent Processor", () => {
  it("should extract Arabic Islamic rulings correctly", () => {
    expect(IntelligentProcessor.extractRuling("هذا أمر لا يجوز في الشريعة")).toBe("حرام");
    expect(IntelligentProcessor.extractRuling("يجب على المسلم أن")).toBe("واجب");
    expect(IntelligentProcessor.extractRuling("يستحب فعل ذلك في الصباح")).toBe("مستحب");
    expect(IntelligentProcessor.extractRuling("وهو أمر مباح لا بأس به")).toBe("مباح");
    expect(IntelligentProcessor.extractRuling("يُكره النوم قبل العشاء")).toBe("مكروه");
    expect(IntelligentProcessor.extractRuling("مجرد نص عادي بدون أحكام")).toBe("unspecified");
  });

  it("should extract English Islamic rulings correctly", () => {
    expect(IntelligentProcessor.extractRuling("it is strictly prohibited in Islam", "en")).toBe("حرام");
    expect(IntelligentProcessor.extractRuling("it is obligatory to fast", "en")).toBe("واجب");
    expect(IntelligentProcessor.extractRuling("it is highly recommended", "en")).toBe("مستحب");
    expect(IntelligentProcessor.extractRuling("it is permissible", "en")).toBe("مباح");
    expect(IntelligentProcessor.extractRuling("it is discouraged", "en")).toBe("مكروه");
  });

  it("should process items and augment with rulings", () => {
    const items: LibraryContentItem[] = [
      { id: "1", title: "Test 1", bookTitle: "B1", category: "fiqh", text: "وهو أمر يجب فعله" },
      { id: "2", title: "Test 2", bookTitle: "B2", category: "fiqh", text: "This is totally haram", language: "en" }
    ];

    const processed = IntelligentProcessor.processItems(items);
    
    expect(processed[0].islamicRuling).toBe("واجب");
    expect(processed[0].language).toBe("ar");
    
    expect(processed[1].islamicRuling).toBe("حرام");
    expect(processed[1].language).toBe("en");
  });
});
