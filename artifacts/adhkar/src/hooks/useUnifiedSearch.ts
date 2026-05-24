import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { allAdhkar } from "@/data/adhkar";
import type { LibraryContentItem } from "@/types/library";

export type ContentType = "dhikr" | "quran" | "hadith" | "fasting" | "all" | "favorites";

export interface SearchResult {
  id: string;
  type: "dhikr" | "quran" | "library";
  title: string;
  text: string;
  category?: string;
  author?: string;
  path: string;
  similarity?: number;
}

const normalizeArabic = (text: string) => {
  if (!text) return "";
  let normalized = text
    .replace(/[\u064B-\u0652]/g, "") // remove diacritics
    .replace(/[إأآا]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .toLowerCase();
  normalized = normalized.replace(/^(سوره|سورة)\s+/, "");
  return normalized.trim();
};

const quranNames = [
  "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس",
  "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه",
  "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم",
  "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر",
  "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق",
  "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة",
  "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج",
  "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس",
  "التكوير", "الانفطار", "المطففين", "الانشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد",
  "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العادية",
  "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر",
  "المسد", "الإخلاص", "الفلق", "الناس"
];

function toSearchable(value: string | undefined) {
  if (!value) return "";
  return normalizeArabic(value);
}

export function useUnifiedSearch() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState<ContentType>("all");
  const [libraryItems, setLibraryItems] = useState<LibraryContentItem[]>([]);
  const [isSmartSearch, setIsSmartSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [semanticResults, setSemanticResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    let alive = true;
    fetch("/data/library_content.json")
      .then((res) => {
        if (!res.ok) throw new Error("Unable to load library content");
        return res.json() as Promise<LibraryContentItem[]>;
      })
      .then((data) => {
        if (alive) setLibraryItems(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (alive) setLibraryItems([]);
      });

    return () => {
      alive = false;
    };
  }, []);

  const normalizedQuery = useMemo(() => normalizeArabic(query), [query]);

  // Debounced semantic search effect
  useEffect(() => {
    if (!isSmartSearch || normalizedQuery.length < 2) {
      setSemanticResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const { generateEmbedding, matchLibraryItems } = await import('@/lib/supabase');
        const embedding = await generateEmbedding(normalizedQuery);
        if (embedding) {
          const matches = await matchLibraryItems(embedding, 0.25, 25);
          const mapped: SearchResult[] = matches.map((match) => ({
            id: match.id,
            type: "library" as const,
            title: match.book_title || match.title,
            text: match.text,
            category: match.category,
            author: match.source,
            path: "/hadith",
            similarity: match.similarity,
          }));
          setSemanticResults(mapped);
        } else {
          setSemanticResults([]);
        }
      } catch (error) {
        console.error('[Semantic Search] Error loading results:', error);
        setSemanticResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 600); // 600ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [normalizedQuery, isSmartSearch]);

  const matches = useCallback(
    (text: string | undefined) => {
      if (!normalizedQuery) return false;
      const haystack = toSearchable(text);
      return normalizedQuery.split(/\s+/).every((token) => haystack.includes(token));
    },
    [normalizedQuery]
  );

  const results = useMemo<SearchResult[]>(() => {
    if (normalizedQuery.length < 2) return [];

    const searchResults: SearchResult[] = [];

    if (activeType === "all" || activeType === "dhikr") {
      const hits = allAdhkar
        .map((dhikr) => ({
          id: dhikr.id,
          type: "dhikr" as const,
          title: dhikr.source,
          text: dhikr.arabic,
          category: t("nav.adhkar"),
          path: "/adhkar",
        }))
        .filter((result) => matches(result.text) || matches(result.title) || matches(result.category))
        .slice(0, 15);
      searchResults.push(...hits);
    }

    if (activeType === "all" || activeType === "quran") {
      const quranHits = quranNames
        .map((name, index) => ({ name, number: index + 1 }))
        .filter((item) => matches(item.name))
        .slice(0, 5)
        .map((item) => ({
          id: `quran-${item.number}`,
          type: "quran" as const,
          title: `سورة ${item.name}`,
          text: t("quran.subtitle", { defaultValue: "القرآن الكريم" }),
          path: `/quran?surah=${item.number}`,
        }));
      searchResults.push(...quranHits);
    }

    if (activeType === "all" || activeType === "hadith") {
      if (isSmartSearch) {
        searchResults.push(...semanticResults);
      } else {
        const libraryHits = libraryItems
          .filter(
            (item) =>
              matches(item.text) ||
              matches(item.bookTitle) ||
              matches(item.title) ||
              matches(item.source) ||
              matches(item.category) ||
              (item.tags ?? []).some((tag) => matches(tag))
          )
          .slice(0, 20)
          .map((item) => ({
            id: item.id,
            type: "library" as const,
            title: item.bookTitle || item.title,
            text: item.text,
            category: item.category,
            author: item.source || item.author,
            path: "/hadith",
          }));
        searchResults.push(...libraryHits);
      }
    }

    return searchResults.slice(0, 40);
  }, [activeType, libraryItems, matches, normalizedQuery.length, t, isSmartSearch, semanticResults]);

  return { 
    query, 
    setQuery, 
    results, 
    activeType, 
    setActiveType, 
    isSmartSearch, 
    setIsSmartSearch, 
    isSearching 
  };
}

