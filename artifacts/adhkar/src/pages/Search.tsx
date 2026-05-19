import { useTranslation } from "react-i18next";
import { useUnifiedSearch, ContentType } from "@/hooks/useUnifiedSearch";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Search as SearchIcon, Book, BookOpen, MessageSquare,
  ChevronRight, Hash, Heart, Filter, Scale, ShieldCheck, Info
} from "lucide-react";
import { Link } from "wouter";
import { useFavorites } from "@/hooks/useFavorites";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEffect, useMemo } from "react";
import { allAdhkar } from "@/data/adhkar";
import { DhikrList } from "@/components/DhikrList";
import { useLibraryContent } from "@/hooks/useLibraryContent";
import type { LibraryContentItem } from "@/types/library";

const typeConfig = {
  dhikr: { icon: MessageSquare, color: "text-amber-500", bg: "bg-amber-500/10", label: "أذكار" },
  quran: { icon: BookOpen, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "قرآن" },
  library: { icon: Book, color: "text-blue-500", bg: "bg-blue-500/10", label: "مكتبة" },
} as const;

const categoryIcons: Record<string, React.ElementType> = {
  tafsir: BookOpen,
  creed: ShieldCheck,
  fiqh: Scale,
  hadith: Book,
  ethics: Heart,
  general: Info,
};

const FILTER_TABS: { id: ContentType; labelKey: string; icon: React.ElementType }[] = [
  { id: "all", labelKey: "hadith.cat_all", icon: Filter },
  { id: "dhikr", labelKey: "nav.adhkar", icon: MessageSquare },
  { id: "quran", labelKey: "nav.quran", icon: BookOpen },
  { id: "hadith", labelKey: "nav.hadith", icon: Book },
  { id: "favorites", labelKey: "nav.favorites", icon: Heart },
];

export default function SearchPage() {
  const { t, i18n } = useTranslation();
  const { query, setQuery, results, activeType, setActiveType } = useUnifiedSearch();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { items: libraryData } = useLibraryContent();

  useEffect(() => {
    if (window.location.search.includes("tab=favorites")) {
      setActiveType("favorites");
    }
  }, [setActiveType]);

  const normalizedQuery = query.trim().toLowerCase();

  // Filter adhkar favorites
  const favoriteAdhkar = useMemo(() => {
    const list = allAdhkar.filter(a => favorites.includes(a.id));
    if (!normalizedQuery) return list;
    return list.filter(a => a.arabic.toLowerCase().includes(normalizedQuery) || a.source.toLowerCase().includes(normalizedQuery));
  }, [favorites, normalizedQuery]);

  // Filter ruling/library favorites
  const favoriteRulings = useMemo(() => {
    const combined = libraryData.filter((item) => favorites.includes(item.id));
    if (!normalizedQuery) return combined;
    return combined.filter((item) =>
      item.text.toLowerCase().includes(normalizedQuery) ||
      item.title.toLowerCase().includes(normalizedQuery) ||
      item.bookTitle.toLowerCase().includes(normalizedQuery)
    );
  }, [favorites, libraryData, normalizedQuery]);

  return (
    <div className="animate-in fade-in duration-500 max-w-3xl mx-auto space-y-6 pt-6 pb-20">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <SearchIcon className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-3xl font-heading font-bold text-primary">
          {t("search.title", { defaultValue: "البحث الشامل" })}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t("search.subtitle", { defaultValue: "ابحث في القرآن والأذكار والمكتبة العلمية" })}
        </p>
      </div>

      {/* Search Input */}
      <div className="relative group">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground transition-colors group-focus-within:text-primary" />
        <Input
          className="pl-14 h-16 rounded-[2rem] border-primary/10 bg-card/50 backdrop-blur-md text-lg focus:ring-primary/20 transition-all shadow-sm"
          placeholder={t("search.placeholder", { defaultValue: "عن ماذا تبحث؟..." })}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {FILTER_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveType(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap border transition-all",
                activeType === tab.id
                  ? "bg-primary text-primary-foreground border-primary shadow"
                  : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:bg-primary/5"
              )}
            >
              <Icon className="w-4 h-4" />
              {t(tab.labelKey, { defaultValue: tab.id })}
            </button>
          );
        })}
      </div>

      {/* Results */}
      <div className="space-y-3">
        {activeType === "favorites" ? (
          <div className="space-y-12 animate-in fade-in duration-500 pt-2">
            {/* Adhkar Section */}
            {favoriteAdhkar.length > 0 && (
              <section className="space-y-6">
                <h3 className="text-2xl font-bold flex items-center gap-2 text-foreground/80">
                  <BookOpen className="w-6 h-6 text-primary" />
                  {t("nav.adhkar")}
                </h3>
                <DhikrList adhkar={favoriteAdhkar} titleKey="" compact />
              </section>
            )}

            {/* Rulings Section */}
            {favoriteRulings.length > 0 && (
              <section className="space-y-6">
                <h3 className="text-2xl font-bold flex items-center gap-2 text-foreground/80">
                  <Scale className="w-6 h-6 text-primary" />
                  {t("hadith.title", { defaultValue: "الأحاديث والأحكام" })}
                </h3>
                <div className="grid grid-cols-1 gap-6">
                  {favoriteRulings.map((item: LibraryContentItem) => {
                    const Icon = categoryIcons[item.category] || Info;
                    const categoryLabel = t(`hadith.cat_${item.category}`, { defaultValue: item.category });
                    const displayTitle = item.bookTitle || item.title || categoryLabel;
                    const itemId = item.id;

                    return (
                      <motion.div
                        key={itemId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Card className="group border-none shadow-sm bg-card/60 backdrop-blur-sm rounded-[2rem] overflow-hidden">
                          <CardContent className="p-0">
                            <div className="flex flex-col md:flex-row">
                              <div className="w-full md:w-16 bg-primary/5 flex md:flex-col items-center justify-center p-4 gap-4">
                                <Icon className="w-6 h-6 text-primary/60" />
                              </div>
                              
                              <div className="flex-1 p-6 md:p-8 space-y-6">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                                      {categoryLabel}
                                    </span>
                                    <h3 className="text-xl font-bold text-foreground/90 font-heading">
                                      {displayTitle}
                                    </h3>
                                  </div>
                                  <button
                                    onClick={() => toggleFavorite(itemId)}
                                    className="p-2 rounded-full text-red-500 bg-red-50"
                                  >
                                    <Heart className="w-5 h-5 fill-current" />
                                  </button>
                                </div>
                                <div 
                                  className={cn("dhikr-text text-xl leading-relaxed text-foreground/80", i18n.language === 'ar' ? "text-right" : "text-left")}
                                  dir={i18n.language === 'ar' ? "rtl" : "ltr"}
                                >
                                  {item.text}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )}

            {favoriteAdhkar.length === 0 && favoriteRulings.length === 0 && (
              <div className="py-20 text-center space-y-4">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <Heart className="w-10 h-10 text-muted-foreground/30" />
                </div>
                <div className="space-y-1">
                  <p className="text-xl font-bold text-foreground/50">
                    {t("favorites.empty", { defaultValue: "لا توجد مفضلات بعد" })}
                  </p>
                  <p className="text-muted-foreground">
                    {t("favorites.empty_desc", { defaultValue: "ابدأ بإضافة الأذكار أو الأحكام التي تهمك لتظهر هنا" })}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {results.length > 0 ? (
              <>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">
                  {results.length} {t("search.results_count", { defaultValue: "نتيجة" })}
                </p>
                {results.map((result, index) => {
                  const config = typeConfig[result.type];
                  return (
                    <motion.div
                      key={result.id + index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.04 }}
                    >
                      <Link href={result.path}>
                        <Card className="cursor-pointer hover:bg-primary/5 transition-all border-none shadow-sm group overflow-hidden bg-card/60 backdrop-blur-sm rounded-2xl">
                          <CardContent className="p-5 flex items-start gap-4">
                            <div
                              className={cn(
                                "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                                config.bg
                              )}
                            >
                              <config.icon className={cn("w-5 h-5", config.color)} />
                            </div>
                            <div className="flex-1 space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                  {config.label}
                                </span>
                                {result.category && (
                                  <span className="text-[10px] font-medium text-primary/60 truncate">
                                    # {result.category}
                                  </span>
                                )}
                              </div>
                              <h3 className="font-bold text-base text-foreground truncate">
                                {result.title}
                              </h3>
                              <p
                                className="text-muted-foreground text-sm line-clamp-2 leading-relaxed"
                                dir="rtl"
                              >
                                {result.text}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 self-center shrink-0">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleFavorite(result.id);
                                }}
                                className={cn(
                                  "p-2 rounded-full transition-colors",
                                  isFavorite(result.id)
                                    ? "text-red-500 bg-red-50"
                                    : "text-muted-foreground hover:bg-muted"
                                )}
                              >
                                <Heart
                                  className={cn("w-4 h-4", isFavorite(result.id) && "fill-current")}
                                />
                              </button>
                              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  );
                })}
              </>
            ) : query.length >= 2 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Hash className="w-10 h-10 text-muted-foreground/30" />
                </div>
                <h3 className="text-xl font-bold text-muted-foreground">
                  {t("search.no_results", { defaultValue: "لا توجد نتائج مطابقة" })}
                </h3>
                <p className="text-muted-foreground/60 mt-1 text-sm">
                  {t("search.try_other", { defaultValue: "حاول استخدام كلمات مفتاحية أخرى" })}
                </p>
              </motion.div>
            ) : query.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 space-y-4"
              >
                <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
                  {(["أذكار الصباح", "سورة البقرة", "أحكام الصيام"] as string[]).map((hint) => (
                    <button
                      key={hint}
                      onClick={() => setQuery(hint)}
                      className="text-xs px-3 py-2 rounded-xl bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors font-medium border border-border/50"
                    >
                      {hint}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground/50">
                  {t("search.suggestions_hint", { defaultValue: "اقتراحات للبدء" })}
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
