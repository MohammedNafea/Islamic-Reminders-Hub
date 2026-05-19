import type { LibraryContentItem, IslamicRuling } from "@/types/library";

/**
 * Intelligent Processor
 * يستنتج الأحكام الفقهية المتعددة اللغات ويصنف المحتوى المستخرج
 */
export class IntelligentProcessor {
  /**
   * استنتاج الحكم الفقهي من النص
   */
  static extractRuling(text: string, lang: string = "ar"): IslamicRuling {
    const lowerText = text.toLowerCase();
    
    if (lang === "ar") {
      if (/(يحرم|حرام|لا يجوز|منهي عنه|إثم)/.test(lowerText)) return "حرام";
      if (/(يجب|واجب|فرض|لا بد|ينبغي أن)/.test(lowerText)) return "واجب";
      if (/(يستحب|مستحب|سنة|يُسن|مندوب)/.test(lowerText)) return "مستحب";
      if (/(مكروه|يُكره|الأولى تركه)/.test(lowerText)) return "مكروه";
      if (/(يجوز|مباح|لا بأس|جائز)/.test(lowerText)) return "مباح";
    } else if (lang === "en") {
      if (/(prohibited|haram|forbidden|not allowed)/.test(lowerText)) return "حرام";
      if (/(obligatory|fard|must|wajib|required)/.test(lowerText)) return "واجب";
      if (/(recommended|sunnah|encouraged)/.test(lowerText)) return "مستحب";
      if (/(disliked|makruh|discouraged)/.test(lowerText)) return "مكروه";
      if (/(permissible|allowed|halal|mubah)/.test(lowerText)) return "مباح";
    }
    
    return "unspecified";
  }

  /**
   * معالجة وتحسين قائمة من العناصر المكتبية
   */
  static processItems(items: LibraryContentItem[]): LibraryContentItem[] {
    return items.map(item => {
      const language = item.language || (/[a-zA-Z]/.test(item.text.slice(0, 50)) ? "en" : "ar");
      
      return {
        ...item,
        language,
        islamicRuling: item.islamicRuling && item.islamicRuling !== "unspecified" 
          ? item.islamicRuling 
          : this.extractRuling(item.text, language)
      };
    });
  }
}
