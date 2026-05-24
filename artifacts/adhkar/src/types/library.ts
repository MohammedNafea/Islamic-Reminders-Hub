export type LibraryCategory =
  | "tafsir"
  | "creed"
  | "fiqh"
  | "hadith"
  | "ethics"
  | "general"
  | "sira"
  | "library";

/** حكم فقهي مستنتج من النص */
export type IslamicRuling =
  | "واجب"
  | "مستحب"
  | "مباح"
  | "مكروه"
  | "حرام"
  | "unspecified";

export interface LibraryContentItem {
  id: string;
  title: string;
  bookTitle: string;
  author?: string;
  text: string;
  category: LibraryCategory;
  source?: string;
  sourceFile?: string;
  pageRefs?: string[];
  tags?: string[];
  benefits?: string[];
  confidence?: number;
  reviewStatus?: "auto_extracted" | "needs_review" | string;
  /** اللغة: ar, en, fr, tr, ur, ... */
  language?: string;
  /** الحكم الفقهي المستنتج */
  islamicRuling?: IslamicRuling;
  /** المذهب أو الاتجاه الفقهي */
  jurisdiction?: string;
  /** الدليل الشرعي */
  sourceReference?: string;
  /** رابط الصورة/الوسائط المستخرجة من PDF */
  mediaUrl?: string;
  /** قائمة مسارات الصور المستخرجة */
  imageUrls?: string[];
}

export interface WikiBundle {
  metadata: {
    lastUpdated: string;
    totalSources: number;
    totalConcepts: number;
    totalLibraryItems?: number;
    storage?: string;
    redaction?: string;
  };
  library: LibraryContentItem[];
  adhkar: Record<string, unknown>;
  daily: {
    verse: string;
    inspiration: string;
    sura?: string;
    verse_number?: string;
    verse_en?: string;
    verse_en_sura?: string;
  };
}

export interface EncyclopediaMetadata {
  lastUpdated: string;
  totalSources: number;
  totalConcepts: number;
  totalLibraryItems: number;
  storage: string;
  redaction: string;
  categories: LibraryCategory[];
  languages: string[];
}

