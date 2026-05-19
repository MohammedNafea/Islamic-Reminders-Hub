import { useTranslation } from "react-i18next";
import type React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Book, BookOpen, Scale, ShieldCheck, Heart, Info, Library as LibraryIcon, Loader2, History, Sparkles, Quote } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { isArabic } from "@/lib/content-i18n";
import { useLibraryContent } from "@/hooks/useLibraryContent";
import type { LibraryContentItem } from "@/types/library";
import Fuse from "fuse.js";

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  tafsir: BookOpen,
  creed: ShieldCheck,
  fiqh: Scale,
  hadith: Book,
  ethics: Heart,
  sira: History,
  general: Info,
  library: LibraryIcon,
};

export default function HadithRulings() {
  const { t, i18n } = useTranslation();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const { items: libraryData, loading: loadingLibrary } = useLibraryContent();

  const sortedLibraryData = useMemo(() => {
    return [...libraryData].sort((a, b) => {
      const aIsSeed = a.id.startsWith("seed-");
      const bIsSeed = b.id.startsWith("seed-");
      if (aIsSeed && !bIsSeed) return -1;
      if (!aIsSeed && bIsSeed) return 1;
      if (aIsSeed && bIsSeed) {
        return a.id.localeCompare(b.id);
      }
      return 0;
    });
  }, [libraryData]);

  const fuse = useMemo(() => {
    if (sortedLibraryData.length === 0) return null;
    return new Fuse(sortedLibraryData, {
      keys: ["text", "title", "bookTitle", "source", "category", "tags"],
      threshold: 0.36,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });
  }, [sortedLibraryData]);

  const filteredData = useMemo(() => {
    const categoryFiltered = activeCategory === "all"
      ? sortedLibraryData
      : sortedLibraryData.filter((item) => item.category === activeCategory);

    if (!searchQuery.trim()) return categoryFiltered.slice(0, 200);

    const results = fuse?.search(searchQuery).map((result) => result.item) ?? [];
    const sortedResults = [...results].sort((a, b) => {
      const aIsSeed = a.id.startsWith("seed-");
      const bIsSeed = b.id.startsWith("seed-");
      if (aIsSeed && !bIsSeed) return -1;
      if (!aIsSeed && bIsSeed) return 1;
      return 0;
    });

    const scoped = activeCategory === "all"
      ? sortedResults
      : sortedResults.filter((item) => item.category === activeCategory);

    return scoped.slice(0, 200);
  }, [activeCategory, fuse, sortedLibraryData, searchQuery]);

  const splitCards = useMemo(() => {
    const list: Array<{
      item: LibraryContentItem;
      paragraphText: string;
      paragraphIndex: number;
      uniqueId: string;
    }> = [];

    filteredData.forEach((item) => {
      // Split by newline and filter out empty paragraphs
      const paragraphs = item.text.split("\n").map(p => p.trim()).filter(Boolean);
      paragraphs.forEach((paragraph, index) => {
        list.push({
          item,
          paragraphText: paragraph,
          paragraphIndex: index,
          uniqueId: `${item.id}-p-${index}`,
        });
      });
    });

    return list;
  }, [filteredData]);

  const categories = [
    { id: "all", label: t("hadith.cat_all"), icon: LibraryIcon },
    { id: "hadith", label: t("hadith.cat_hadith"), icon: Book },
    { id: "sira", label: t("hadith.cat_sira"), icon: History },
    { id: "fiqh", label: t("hadith.cat_fiqh"), icon: Scale },
    { id: "creed", label: t("hadith.cat_creed"), icon: ShieldCheck },
    { id: "tafsir", label: t("hadith.cat_tafsir"), icon: BookOpen },
    { id: "ethics", label: t("hadith.cat_ethics"), icon: Heart },
    { id: "general", label: t("hadith.cat_general"), icon: Info },
    { id: "library", label: t("hadith.cat_library", "المكتبة"), icon: LibraryIcon },
  ];

  const showArabicDirection = isArabic(i18n.language);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8 max-w-4xl mx-auto pb-12">
      <div className="text-center space-y-3 pt-6">
        <h2 className="text-4xl font-heading font-bold text-primary tracking-tight">
          {t("hadith.title")}
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
          {t("hadith.subtitle")}
        </p>
      </div>

      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl py-4 -mx-4 px-4 space-y-4">
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <Input
            className="pl-12 h-14 rounded-2xl border-primary/10 bg-card/50 backdrop-blur-sm shadow-sm focus:ring-2 focus:ring-primary/20 transition-all text-lg"
            placeholder={t("hadith.search_placeholder")}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border",
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                    : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:bg-primary/5"
                )}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {!loadingLibrary && (
          <div className="flex items-center justify-between px-1">
            <p className="text-sm text-muted-foreground">
              {t("hadith.showing_results", { count: splitCards.length })}
            </p>
            {searchQuery && (
              <p className="text-xs text-muted-foreground/60">
                &ldquo;{searchQuery}&rdquo;
              </p>
            )}
          </div>
        )}

        {loadingLibrary ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground animate-pulse">{t("hadith.loading_library")}</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {splitCards.length > 0 ? (
              splitCards.map(({ item, paragraphText, paragraphIndex, uniqueId }, index: number) => {
                const Icon = categoryIcons[item.category] || Info;
                const categoryLabel = t(`hadith.cat_${item.category}`, { defaultValue: item.category });
                const parentId = item.id;

                return (
                  <motion.div
                    key={uniqueId}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: Math.min(index * 0.02, 0.3) }}
                  >
                    <Card className="group border-none shadow-sm hover:shadow-xl transition-all duration-300 bg-card/60 backdrop-blur-sm rounded-[2rem] overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row">
                          <div className="w-full md:w-16 bg-primary/5 flex md:flex-col items-center justify-center p-4 gap-4">
                            <Icon className="w-6 h-6 text-primary/60" />
                            <div className="md:rotate-180 md:[writing-mode:vertical-lr] text-[10px] font-bold uppercase tracking-widest text-primary/40 hidden md:block">
                              {categoryLabel}
                            </div>
                          </div>

                          <div className="flex-1 p-6 md:p-8 space-y-6">
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                                  {categoryLabel}
                                </span>
                                <h3 className="text-xl font-bold text-foreground/90 font-heading leading-tight">
                                  {item.bookTitle || item.title}
                                </h3>
                                {item.reviewStatus === "needs_review" && (
                                  <p className="text-xs text-amber-600 font-medium">
                                    {t("hadith.needs_review", { defaultValue: "يحتاج مراجعة علمية" })}
                                  </p>
                                )}
                              </div>

                              <button
                                onClick={() => toggleFavorite(parentId)}
                                className={cn(
                                  "p-2 rounded-full transition-colors",
                                  isFavorite(parentId)
                                    ? "text-red-500 bg-red-50"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                              >
                                <Heart className={cn("w-5 h-5", isFavorite(parentId) && "fill-current")} />
                              </button>
                            </div>

                            <div
                              className="dhikr-text text-2xl leading-relaxed text-foreground/80 text-right"
                              dir={showArabicDirection ? "rtl" : "auto"}
                            >
                              <p>{paragraphText}</p>
                            </div>

                            {item.tags && item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-4 border-t border-primary/5">
                                {item.islamicRuling && (
                                  <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                                    حكم: {item.islamicRuling}
                                  </span>
                                )}
                                {item.jurisdiction && (
                                  <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                                    مذهب: {item.jurisdiction}
                                  </span>
                                )}
                                {item.language && (
                                  <span className="text-[11px] font-medium text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg">
                                    {item.language.toUpperCase()}
                                  </span>
                                )}
                                {item.tags.map((tag) => (
                                  <span key={tag} className="text-[11px] font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-lg">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {item.source && (
                              <div className="pt-4 border-t border-primary/5 space-y-1">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Quote className="w-3.5 h-3.5" />
                                  <span className="text-[11px] font-bold uppercase tracking-wider">{t("hadith.source_label")}</span>
                                </div>
                                <p className="text-sm text-muted-foreground/80 leading-relaxed" dir="rtl">
                                  {item.source}
                                </p>
                              </div>
                            )}

                            {paragraphIndex === 0 && item.benefits && item.benefits.length > 0 && (
                              <div className="pt-4 border-t border-primary/5 space-y-2">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span className="text-[11px] font-bold uppercase tracking-wider">{t("hadith.benefits_label")}</span>
                                </div>
                                <ul className="space-y-1.5">
                                  {item.benefits.map((benefit, benefitIndex) => (
                                    <li key={`${parentId}-benefit-${benefitIndex}`} className="text-sm text-muted-foreground/80 leading-relaxed flex gap-2" dir="rtl">
                                      <span className="text-primary/40 mt-1 shrink-0">•</span>
                                      <span>{benefit}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-20 text-center space-y-4"
              >
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <Search className="w-10 h-10 text-muted-foreground/30" />
                </div>
                <div className="space-y-1">
                  <p className="text-xl font-bold text-foreground/50">{t("hadith.no_results")}</p>
                  <p className="text-muted-foreground">{t("hadith.try_another_search")}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
