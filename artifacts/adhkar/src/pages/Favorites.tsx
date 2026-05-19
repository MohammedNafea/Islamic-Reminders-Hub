import { useTranslation } from "react-i18next";
import { useFavorites } from "@/hooks/useFavorites";
import { DhikrList } from "@/components/DhikrList";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Info, Book, Scale, ShieldCheck, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { allAdhkar } from "@/data/adhkar"; // I'll need to export allAdhkar or similar
import { cn } from "@/lib/utils";
import { useLibraryContent } from "@/hooks/useLibraryContent";
import type { LibraryContentItem } from "@/types/library";

import * as React from "react";

const categoryIcons: Record<string, React.ElementType> = {
  tafsir: BookOpen,
  creed: ShieldCheck,
  fiqh: Scale,
  hadith: Book,
  ethics: Heart,
  general: Info,
};

export default function Favorites() {
  const { t, i18n } = useTranslation();
  const { favorites, toggleFavorite } = useFavorites();
  const { items: libraryData } = useLibraryContent();

  // Filter adhkar favorites
  const favoriteAdhkar = useMemo(() => {
    return allAdhkar.filter(a => favorites.includes(a.id));
  }, [favorites]);

  // Filter ruling/library favorites
  const favoriteRulings = useMemo(() => {
    return libraryData.filter((item) => favorites.includes(item.id));
  }, [favorites, libraryData]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8 max-w-4xl mx-auto pb-12">
      <div className="text-center space-y-3 pt-6">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-red-500 fill-current" />
        </div>
        <h2 className="text-4xl font-heading font-bold text-primary tracking-tight">
          {t("nav.favorites") || "المفضلة"}
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
          {t("favorites.subtitle") || "قائمة الأذكار والأحكام التي قمت بحفظها"}
        </p>
      </div>

      <div className="space-y-12">
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
              {t("hadith.title")}
            </h3>
            <div className="grid grid-cols-1 gap-6">
              {favoriteRulings.map((item: LibraryContentItem) => {
                const Icon = categoryIcons[item.category] || Info;
                const categoryLabel = t(`hadith.cat_${item.category}`);
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
                {t("favorites.empty") || "لا توجد مفضلات بعد"}
              </p>
              <p className="text-muted-foreground">
                {t("favorites.empty_desc") || "ابدأ بإضافة الأذكار أو الأحكام التي تهمك لتظهر هنا"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
