import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { getTextDirection, isRTL } from "@/lib/content-i18n";

const cleanBismillah = (text: string) => {
  if (!text) return "";
  
  const bismillahs = [
    "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
    "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ",
    "بِسْمِ ...", // (could also have others, standard ones are sufficient)
    "بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ",
    "بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ"
  ];
  
  let cleanedText = text;
  for (const bish of bismillahs) {
    if (cleanedText.startsWith(bish)) {
      const remaining = cleanedText.slice(bish.length).trim();
      if (remaining.length > 0) {
        cleanedText = remaining;
        break;
      }
    }
  }
  return cleanedText;
};

interface Ayah {
  number: number;
  text: string;
  audio: string;
  numberInSurah: number;
  translatedText?: string;
}

interface QuranSearchProps {
  isOpen: boolean;
  onClose: () => void;
  ayahs: Ayah[];
  onAyahClick: (numberInSurah: number) => void;
  surahName: string;
}

export default function QuranSearch({
  isOpen,
  onClose,
  ayahs,
  onAyahClick,
  surahName,
}: QuranSearchProps) {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState("");

  const filteredAyahs = useMemo(() => {
    if (!query.trim()) return [];
    
    // Normalize Arabic text to find matches without diacritics
    const normalizeArabic = (text: string) => {
      return text
        .replace(/[\u064B-\u0652]/g, "") // remove diacritics
        .replace(/[إأآا]/g, "ا")
        .replace(/ة/g, "ه")
        .replace(/ى/g, "ي")
        .toLowerCase();
    };

    const normalizedQuery = normalizeArabic(query);

    return ayahs.filter(
      (a) =>
        normalizeArabic(a.text).includes(normalizedQuery) ||
        (a.translatedText &&
          a.translatedText.toLowerCase().includes(query.toLowerCase()))
    );
  }, [query, ayahs]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg rounded-[2rem] p-6 gap-4 bg-card/95 backdrop-blur-md border-primary/10">
        <DialogHeader className="text-start">
          <DialogTitle className="text-xl font-bold font-heading text-primary">
            {t("quran.search_in_surah", { defaultValue: "البحث في سورة" })} {surahName}
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-10 h-11 rounded-xl border-primary/10 bg-muted/40"
            placeholder={t("quran.search_placeholder", { defaultValue: "اكتب كلمة أو آية للبحث..." })}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        <ScrollArea className="h-[300px] pr-2 mt-2">
          {query.trim() === "" ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {t("quran.search_start_hint", { defaultValue: "ابدأ بكتابة الكلمات للبحث في السورة" })}
            </div>
          ) : filteredAyahs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {t("quran.no_results", { defaultValue: "لا توجد نتائج مطابقة" })}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAyahs.map((ayah) => (
                <div
                  key={ayah.number}
                  onClick={() => {
                    onAyahClick(ayah.numberInSurah);
                    onClose();
                  }}
                  className="p-3.5 rounded-xl border border-primary/5 bg-background hover:bg-primary/5 cursor-pointer transition-all text-right space-y-2 group"
                >
                  <div className="flex justify-between items-center" dir="rtl">
                    <span className="text-[10px] font-black bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                      {t("common.ayah", { defaultValue: "آية" })} {ayah.numberInSurah}
                    </span>
                  </div>
                  <p className="dhikr-text text-lg leading-relaxed text-foreground" dir="rtl">
                    {cleanBismillah(ayah.text)}
                  </p>
                  {ayah.translatedText && (
                    <p 
                      className={cn("text-xs text-muted-foreground", isRTL(i18n.language) ? "text-right" : "text-left")} 
                      dir={getTextDirection(i18n.language)}
                    >
                      {ayah.translatedText}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
