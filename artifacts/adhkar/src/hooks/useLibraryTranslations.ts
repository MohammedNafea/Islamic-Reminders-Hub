import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { isArabic } from "@/lib/content-i18n";

interface LibraryTranslation {
  [itemId: string]: {
    title?: string;
    bookTitle?: string;
    text?: string;
    source?: string;
    benefits?: string[];
  };
}

/**
 * Hook to load library content translations for the current language.
 * Returns the translation map and loading state.
 * Falls back gracefully — if no translation file exists, returns empty map.
 */
export function useLibraryTranslations() {
  const { i18n } = useTranslation();
  const [translations, setTranslations] = useState<LibraryTranslation>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isArabic(i18n.language)) {
      setTranslations({});
      return;
    }

    setLoading(true);
    fetch(`/data/library_content.i18n/${i18n.language}.json`)
      .then(res => {
        if (!res.ok) throw new Error("No translation file");
        return res.json();
      })
      .then(data => {
        setTranslations(data);
        setLoading(false);
      })
      .catch(() => {
        setTranslations({});
        setLoading(false);
      });
  }, [i18n.language]);

  return { translations, loading };
}
