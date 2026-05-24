import { useState, useMemo } from "react";
import Fuse from "fuse.js";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { LibraryContentItem } from "@/types/library";

interface WikiSearchProps {
  items: LibraryContentItem[];
  onResultClick?: (item: LibraryContentItem) => void;
}

export function WikiSearch({ items, onResultClick }: WikiSearchProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  const fuse = useMemo(() => {
    return new Fuse(items, {
      keys: ["title", "bookTitle", "text", "tags", "category", "islamicRuling", "jurisdiction", "language"],
      threshold: 0.3,
      includeMatches: true,
      minMatchCharLength: 3,
    });
  }, [items]);

  const results = useMemo(() => {
    if (!query) return [];
    return fuse.search(query).slice(0, 15).map(r => r.item);
  }, [query, fuse]);

  return (
    <div className="w-full relative">
      <div className="relative">
        <input
          type="text"
          className="w-full bg-card border-2 border-primary/20 rounded-2xl px-12 py-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm text-lg"
          placeholder={t("wiki.search_placeholder", "ابحث في الموسوعة الذكية (حديث، فقه، أحكام)...")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground opacity-50" />
      </div>

      {query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border rounded-2xl shadow-xl z-50 max-h-[60vh] overflow-y-auto">
          {results.length > 0 ? (
            <div className="divide-y">
              {results.map((item) => (
                <div 
                  key={item.id} 
                  className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onResultClick && onResultClick(item)}
                >
                  <h4 className="font-bold text-primary mb-1 flex items-center gap-2">
                    {item.title}
                    {item.language && (
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded uppercase">
                        {item.language}
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {item.text}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {item.islamicRuling && item.islamicRuling !== "unspecified" && (
                      <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                        {item.islamicRuling}
                      </span>
                    )}
                    {item.jurisdiction && (
                      <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {item.jurisdiction}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              {t("wiki.no_results", "لم يتم العثور على نتائج مطابقة بحثك.")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
