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
  path: string;
}

const quranNames = [
  "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة",
  "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس",
  "هود", "يوسف", "الرعد", "إبراهيم", "الحجر",
  "النحل", "الإسراء", "الكهف", "مريم", "طه",
  "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان",
];

function toSearchable(value: string | undefined) {
  return (value ?? "").toLowerCase();
}

export function useUnifiedSearch() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState<ContentType>("all");
  const [libraryItems, setLibraryItems] = useState<LibraryContentItem[]>([]);

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

  const normalizedQuery = useMemo(() => query.trim().toLowerCase(), [query]);

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
        .filter((name) => matches(name))
        .slice(0, 5)
        .map((name, index) => ({
          id: `quran-${index}`,
          type: "quran" as const,
          title: name,
          text: t("quran.subtitle", { defaultValue: "القرآن الكريم" }),
          path: "/quran",
        }));
      searchResults.push(...quranHits);
    }

    if (activeType === "all" || activeType === "hadith") {
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
          path: "/hadith",
        }));
      searchResults.push(...libraryHits);
    }

    return searchResults.slice(0, 40);
  }, [activeType, libraryItems, matches, normalizedQuery.length, t]);

  return { query, setQuery, results, activeType, setActiveType };
}
