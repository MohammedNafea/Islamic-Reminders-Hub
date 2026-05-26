import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fastingDays } from "@/data/fasting-days";
import { toHijri, formatHijriDate, hijriToGregorian } from "@/lib/hijri";
import { useMemo } from "react";
import { Calendar, Clock, Info } from "lucide-react";
import { getTranslation } from "@/lib/content-i18n";
import { TranslatedText } from "@/components/TranslatedText";
import { cn, safeFormatDate } from "@/lib/utils";

export default function Fasting() {
  const { t, i18n } = useTranslation();
  const today = useMemo(() => new Date(), []);
  const hijriToday = useMemo(() => toHijri(today), [today]);
  
  const upcomingDates = useMemo(() => {
    return fastingDays.map(day => {
      let nextDate: Date | null = null;
      
      if (day.type === "weekly" && day.weekDay) {
        const targetDay = day.weekDay[0];
        nextDate = new Date(today);
        const diff = (targetDay + 7 - today.getDay()) % 7;
        nextDate.setDate(today.getDate() + (diff === 0 ? 0 : diff));
      } else if (day.type === "monthly" && Array.isArray(day.hijriDay)) {
        // Find next white days
        const targetDay = day.hijriDay[0];
        if (hijriToday.day > day.hijriDay[2]) {
          // Next month
          const nextMonth = hijriToday.month === 12 ? 1 : hijriToday.month + 1;
          const nextYear = hijriToday.month === 12 ? hijriToday.year + 1 : hijriToday.year;
          nextDate = hijriToGregorian(nextYear, nextMonth, targetDay);
        } else {
          // Current month
          nextDate = hijriToGregorian(hijriToday.year, hijriToday.month, targetDay);
        }
      } else if (day.type === "yearly" && day.hijriMonth && day.hijriDay) {
        const targetDay = typeof day.hijriDay === 'number' ? day.hijriDay : day.hijriDay[0];
        if (hijriToday.month > day.hijriMonth || (hijriToday.month === day.hijriMonth && hijriToday.day > targetDay)) {
          nextDate = hijriToGregorian(hijriToday.year + 1, day.hijriMonth, targetDay);
        } else {
          nextDate = hijriToGregorian(hijriToday.year, day.hijriMonth, targetDay);
        }
      }
      
      return { ...day, nextDate };
    }).sort((a, b) => {
      if (!a.nextDate) return 1;
      if (!b.nextDate) return -1;
      return a.nextDate.getTime() - b.nextDate.getTime();
    });
  }, [hijriToday, today]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8 max-w-3xl mx-auto pb-12">
      <div className="text-center space-y-3 pt-6">
        <h2 className="text-4xl font-heading font-bold text-primary tracking-tight">
          <TranslatedText
            text={t("fasting.title", { lng: "ar" })}
            staticTranslation={getTranslation(t, "fasting.title", i18n.language) || undefined}
            keepArabic={false}
            className="text-4xl font-heading font-bold text-primary tracking-tight"
          />
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
          <TranslatedText
            text={t("fasting.white_days_desc", { lng: "ar" })}
            staticTranslation={getTranslation(t, "fasting.white_days_desc", i18n.language) || undefined}
            keepArabic={false}
            className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed"
          />
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {upcomingDates.map((day) => {
          const isToday = day.nextDate && 
            day.nextDate.getDate() === today.getDate() && 
            day.nextDate.getMonth() === today.getMonth() &&
            day.nextDate.getFullYear() === today.getFullYear();

          return (
            <Card key={day.id} className={cn(
              "group border-none shadow-sm hover:shadow-xl transition-all duration-300 bg-card/60 backdrop-blur-sm rounded-[2rem] overflow-hidden",
              isToday && "ring-2 ring-emerald-500/50 bg-emerald-500/5"
            )}>
              <CardHeader className="pb-4 pt-8 px-8">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-2xl font-bold text-primary font-heading">
                        <TranslatedText
                          text={t(day.nameKey, { lng: "ar" })}
                          staticTranslation={getTranslation(t, day.nameKey, i18n.language) || undefined}
                          keepArabic={false}
                          className="text-2xl font-bold font-heading"
                        />
                      </CardTitle>
                      {isToday && (
                        <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">
                          {t("dates.today")}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground font-medium">
                      <TranslatedText
                        text={t(day.descriptionKey, { lng: "ar" })}
                        staticTranslation={getTranslation(t, day.descriptionKey, i18n.language) || undefined}
                        keepArabic={false}
                        className="text-muted-foreground font-medium"
                      />
                    </p>
                  </div>
                  <div className="bg-primary/10 text-primary text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                    <TranslatedText
                      text={t(`fasting.${day.type}`, { lng: "ar" })}
                      staticTranslation={getTranslation(t, `fasting.${day.type}`, i18n.language) || undefined}
                      keepArabic={false}
                      inline={true}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-8 space-y-6">
                {day.nextDate && (
                  <div className="flex flex-col md:flex-row gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-3 text-sm font-bold text-primary">
                      <Calendar className="w-5 h-5 opacity-60" />
                      <span>{safeFormatDate(day.nextDate, i18n.language, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                    </div>
                    <div className="hidden md:block w-px h-4 bg-primary/20" />
                    <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground">
                      <Clock className="w-5 h-5 opacity-60" />
                      <span dir="rtl">{formatHijriDate(toHijri(day.nextDate), i18n.language)}</span>
                    </div>
                  </div>
                )}
                
                <div className="relative p-6 rounded-2xl bg-muted/30 border border-border/50">
                  <Info className="absolute top-4 right-4 w-5 h-5 text-primary/20" />
                  <TranslatedText
                    text={t(day.hadithKey, { lng: "ar" })}
                    staticTranslation={getTranslation(t, day.hadithKey, i18n.language) || undefined}
                    keepArabic={true}
                    className="dhikr-text text-xl leading-relaxed text-foreground/80 italic pr-8"
                    arabicClassName="text-right"
                    translationClassName="pt-4"
                  />
                  <div className="mt-4 border-t border-primary/5 pt-2 flex flex-col items-end">
                    <TranslatedText
                      text={day.source}
                      staticTranslation={getTranslation(t, `fasting.sources.${day.id}`, i18n.language) || undefined}
                      keepArabic={true}
                      isDhikr={false}
                      className="text-xs text-muted-foreground font-bold uppercase tracking-wider"
                      arabicClassName="text-right block text-xs"
                      translationClassName="text-[10px] text-muted-foreground/60 block border-t-0 pt-1 mt-0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
