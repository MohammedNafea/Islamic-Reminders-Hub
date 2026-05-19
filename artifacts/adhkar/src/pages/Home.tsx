import React, { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toHijri, formatHijriDate } from "@/lib/hijri";
import { getPrayerTimesFromAPI } from "@/lib/prayer-times";
import { getSettings, getTasbihCount, setTasbihCount } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Sun, Moon, Bed, Bookmark, Shield, Clock, BookOpen, Calendar as CalendarIcon, Star as StarIcon, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { isArabic, getTranslation } from "@/lib/content-i18n";
import { fastingDays } from "@/data/fasting-days";
import { useWiki } from "@/hooks/useWiki";

export default function Home() {
  const { t, i18n } = useTranslation();
  const [date, setDate] = useState(new Date());
  const [hijri, setHijri] = useState(toHijri(new Date()));
  const [salawatCount, setSalawatCount] = useState(0);
  const vibrateRef = useRef<number>(0);
  const settings = getSettings();

  const prevDayRef = useRef(date.getDate());

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setDate(now);
      if (now.getDate() !== prevDayRef.current) {
        prevDayRef.current = now.getDate();
        setHijri(toHijri(now));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setSalawatCount(getTasbihCount("home_salawat", true));
  }, []);

  useEffect(() => {
    async function fetchPrayerTimes() {
      let lat = 21.4225;
      let lng = 39.8262;
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
          );
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch { /* fallback Mecca */ }
      }
      const method = settings.calculationMethod === "MuslimWorldLeague" ? 3
        : settings.calculationMethod === "Egyptian" ? 5 : 4;
      await getPrayerTimesFromAPI(lat, lng, new Date(), method);
    }
    fetchPrayerTimes();
  }, [settings.calculationMethod, hijri.day]);

  const handleSalawat = () => {
    const next = salawatCount + 1;
    setSalawatCount(next);
    setTasbihCount("home_salawat", next, true);
    if (settings?.vibrate && navigator.vibrate) {
      const now = Date.now();
      if (now - vibrateRef.current > 80) {
        navigator.vibrate(15);
        vibrateRef.current = now;
      }
    }
  };

  // Hourly Content Logic — random per hour using seeded hash
  const { data: wikiData } = useWiki();
  const currentHour = date.getHours();

  // Seeded random: same hour on same date = same result, different hour = different result
  const hourlySeed = useMemo(() => {
    const d = date;
    return ((d.getFullYear() * 366 + d.getMonth() * 31 + d.getDate()) * 24 + currentHour) % 1000003;
  }, [date, currentHour]);
  
  const hourlyRandom = React.useCallback((poolLength: number) => hourlySeed % poolLength, [hourlySeed]);

  const dailyVerse = useMemo(() => {
    const normalizeArabic = (text: string) => {
      if (!text) return "";
      return text
        .replace(/[\u064B-\u0652]/g, "") // Remove Tashkeel (diacritics)
        .replace(/[إأآا]/g, "ا")         // Normalize Alif
        .replace(/ة/g, "ه")             // Normalize Teh Marbuta
        .replace(/ى/g, "ي")             // Normalize Alif Maksura
        .replace(/\s+/g, " ")           // Normalize whitespace
        .trim();
    };

    // Standard pool with full metadata
    const versePool = [1, 2, 3, 4, 5, 6, 7, 8];
    const vId = versePool[hourlyRandom(versePool.length)];
    
    // Always fetch Arabic for matching purposes
    const translationAr = i18n.getResourceBundle('ar', 'translation');
    const allArVerses = (translationAr?.quran?.daily || {}) as Record<string, Record<string, string>>;
    const localVerseAr = allArVerses[vId];
    const localVerse = t(`quran.daily.${vId}`, { returnObjects: true }) as Record<string, string>;

    // Priority logic
    if (wikiData?.daily?.verse) {
      const wikiText = wikiData.daily.verse.trim();
      const normalizedWiki = normalizeArabic(wikiText);
      
      // 1. Try Wiki metadata — always keep Arabic, add translation
      if (wikiData.daily.sura && wikiData.daily.verse_number) {
        return {
          arabicText: wikiText,
          translatedText: !isArabic(i18n.language) ? (wikiData.daily.verse_en || null) : null,
          text: wikiText,
          sura: wikiData.daily.sura,
          verse_number: wikiData.daily.verse_number,
          id: "wiki"
        };
      }

      // 2. Try matching against ALL local verses (in Arabic) to recover metadata
      for (const [id, item] of Object.entries(allArVerses)) {
        const arItem = item;
        if (arItem && normalizeArabic(arItem.text) === normalizedWiki) {
          // Found match! Use localized metadata
          const localizedItem = t(`quran.daily.${id}`, { returnObjects: true }) as Record<string, string>;
          return { ...localizedItem, id };
        }
      }
    }

    // Fallback to local pool which is guaranteed to have metadata
    const fallback = localVerse && typeof localVerse === 'object' ? localVerse : localVerseAr;
    const arabicFallback = localVerseAr || fallback;
    const translatedVerseText = !isArabic(i18n.language) && fallback?.translation ? fallback.translation : null;
    return { 
      arabicText: arabicFallback?.text || fallback?.text || "فاصبر إن وعد الله حق",
      translatedText: translatedVerseText,
      text: arabicFallback?.text || fallback?.text || "فاصبر إن وعد الله حق", 
      sura: fallback?.sura || "الروم", 
      verse_number: fallback?.verse_number || "60", 
      id: vId.toString() 
    };
  }, [t, wikiData, i18n, hourlyRandom]);

  const dailyHadith = useMemo(() => {
    // Use adhkar pool for authentic hadiths
    const hadithPool = [
      { id: "h1", arabic: "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى", english: "Actions are but by intentions, and every person shall have what he intended.", source: "متفق عليه" },
      { id: "h2", arabic: "مَنْ صَلَّى عَلَيَّ صَلَاةً وَاحِدَةً صَلَّى اللَّهُ عَلَيْهِ عَشْرًا", english: "Whoever sends blessings upon me once, Allah sends blessings upon him ten times.", source: "رواه مسلم" },
      { id: "h3", arabic: "بَلِّغُوا عَنِّي وَلَوْ آيَةً", english: "Convey from me even if it is a single verse.", source: "رواه البخاري" },
      { id: "h4", arabic: "الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ", english: "A Muslim is the one from whose tongue and hand the Muslims are safe.", source: "متفق عليه" },
      { id: "h5", arabic: "الدِّينُ النَّصِيحَةُ", english: "Religion is sincerity (advice).", source: "رواه مسلم" },
    ];
    return hadithPool[hourlyRandom(hadithPool.length)];
  }, [hourlyRandom]);

  const upcomingFasting = useMemo(() => {
    return fastingDays.find(d => {
      if (d.type === 'weekly' && d.weekDay?.includes(date.getDay())) return true;
      if (d.hijriMonth === hijri.month && (Array.isArray(d.hijriDay) ? d.hijriDay.includes(hijri.day) : d.hijriDay === hijri.day)) return true;
      return false;
    });
  }, [date, hijri]);

  let greetingKey = "home.greeting_morning";
  if (currentHour >= 12 && currentHour < 18) greetingKey = "home.greeting_evening";
  else if (currentHour >= 18) greetingKey = "home.greeting_night";

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-3xl mx-auto pb-32">
      {/* Greeting + Date */}
      <div className="flex flex-col items-center text-center space-y-4 pt-2">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-primary">
            {t(greetingKey)}
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            {wikiData?.daily?.inspiration || t("app.tagline")}
          </p>
        </div>

        <div className="bg-card/50 backdrop-blur-md px-8 py-4 rounded-[2rem] border border-primary/10 shadow-sm flex flex-col items-center gap-1.5 min-w-[280px]">
          <p className="text-2xl font-serif font-bold text-foreground" dir="rtl">
            {formatHijriDate(hijri, i18n.language)}
          </p>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <CalendarIcon className="w-4 h-4 opacity-70" />
            <span>{date.toLocaleDateString(i18n.language, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
          </div>
        </div>
      </div>

      {/* Salawat on the Prophet ﷺ Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <button
          onClick={handleSalawat}
          aria-label={t("home.salawat_subtitle")}
          className="w-full text-start group relative"
        >
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground p-6 shadow-xl hover:shadow-2xl transition-all active:scale-[0.98] border border-white/10">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <StarIcon className="w-24 h-24 rotate-12" />
            </div>
            <div className="relative z-10 flex items-center justify-between gap-6">
              <div className="flex-1 min-w-0">
                <p className={cn("dhikr-text text-3xl text-white leading-tight drop-shadow-sm mb-2", i18n.language === 'ar' ? "text-right" : "text-left")} dir={i18n.language === 'ar' ? "rtl" : "ltr"}>
                  {t("home.salawat_banner")}
                </p>
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <p>{t("home.salawat_subtitle")}</p>
                </div>
              </div>
              <div className="shrink-0 bg-white/20 backdrop-blur-md rounded-2xl p-4 min-w-[90px] text-center border border-white/20">
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={salawatCount}
                    initial={{ opacity: 0, scale: 0.5, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.5, y: -10 }}
                    className="block text-4xl font-bold tabular-nums text-white"
                  >
                    {salawatCount}
                  </motion.span>
                </AnimatePresence>
                <span className="text-white/60 text-[10px] uppercase tracking-widest font-bold">{t("home.salawat_today")}</span>
              </div>
            </div>
          </div>
        </button>
      </motion.div>

      {/* Daily Verse & Hadith Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="wait">
          <motion.div
            key="verse-wiki"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            whileHover={{ y: -5 }}
            className="bg-card/40 backdrop-blur-sm border border-primary/5 rounded-3xl p-6 shadow-sm flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                  <BookOpen className="w-4 h-4" />
                  {t("quran.verse_of_hour")}
                </div>
              </div>
              {/* Arabic original — always shown */}
              <p className="dhikr-text text-xl leading-relaxed text-foreground/90 text-right" dir="rtl">
                {dailyVerse?.arabicText || dailyVerse?.text}
              </p>
              {/* Translation — shown for non-Arabic languages */}
              {!isArabic(i18n.language) && dailyVerse?.translatedText && (
                <p className="text-muted-foreground text-base leading-relaxed text-left border-t border-border/30 pt-3 mt-3" dir="ltr">
                  {dailyVerse.translatedText}
                </p>
              )}
            </div>
            <p className="text-xs text-primary/60 font-bold mt-4 text-right">
              {dailyVerse?.sura && dailyVerse.sura !== "" 
                ? `${t(`quran.suras.${dailyVerse.sura}`, { defaultValue: dailyVerse.sura })}${dailyVerse.verse_number ? ` : ${dailyVerse.verse_number}` : ''}` 
                : t("nav.quran")}
            </p>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {dailyHadith && (
            <motion.div
              key={`hadith-${dailyHadith.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              whileHover={{ y: -5 }}
              className="bg-card/40 backdrop-blur-sm border border-primary/5 rounded-3xl p-6 shadow-sm flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
                    <Bookmark className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-600 uppercase tracking-widest">{t("home.hadith_of_hour")}</h3>
                    <p className="text-[10px] text-muted-foreground font-medium">{t("salawat.title")}</p>
                  </div>
                </div>
                {/* Arabic original — always shown */}
                <p className="dhikr-text text-xl leading-relaxed text-foreground/80 line-clamp-4 text-right" dir="rtl">
                  {dailyHadith.arabic}
                </p>
                {/* Translation — shown for non-Arabic languages */}
                {!isArabic(i18n.language) && dailyHadith.english && (
                  <p className="text-muted-foreground text-base leading-relaxed text-left border-t border-border/30 pt-3 mt-3 line-clamp-3" dir="ltr">
                    {dailyHadith.english}
                  </p>
                )}
              </div>
              <p className="text-xs text-amber-600/60 font-bold mt-4 text-right" dir="rtl">
                {dailyHadith.source}
              </p>
              {!isArabic(i18n.language) && (() => {
                const translatedSource = getTranslation(t, `adhkar.sources.${dailyHadith.source}`);
                return translatedSource ? (
                  <p className="text-[10px] text-amber-600/40 mt-1" dir="ltr">
                    {translatedSource}
                  </p>
                ) : null;
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fasting Card */}
      {upcomingFasting && (
        <Card className="bg-emerald-500/10 border-emerald-500/20 overflow-hidden shadow-sm rounded-3xl">
          <CardContent className="p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-600">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-emerald-600/70 text-xs font-bold uppercase tracking-wider">{t("fasting.today_fasting")}</p>
                <p className="text-lg font-bold text-emerald-700">{t(upcomingFasting.nameKey)}</p>
              </div>
            </div>
            <Link href="/fasting">
              <button className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20">
                {t("common.search")}
              </button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Adhkar Hub Grid */}
      <div className="pt-2">
        <h2 className="text-xl font-bold text-foreground mb-4 px-1">{t("nav.adhkar")}</h2>
        <div className="grid grid-cols-2 gap-4">
          <HubCard 
            href="/morning"
            titleKey="nav.morning"
            Icon={Sun}
            color="bg-amber-500"
            description="home.morning_desc"
          />
          <HubCard 
            href="/evening"
            titleKey="nav.evening"
            Icon={Moon}
            color="bg-indigo-600"
            description="home.evening_desc"
          />
          <HubCard 
            href="/sleep"
            titleKey="nav.sleep"
            Icon={Bed}
            color="bg-slate-800"
            description="home.sleep_desc"
          />
          <HubCard 
            href="/prayer"
            titleKey="nav.prayer"
            Icon={Clock}
            color="bg-emerald-600"
            description="home.prayer_desc"
          />
          <HubCard 
            href="/ruqyah"
            titleKey="nav.ruqyah"
            Icon={Heart}
            color="bg-teal-500"
            description="adhkar_hub.ruqyah_desc"
          />
          <HubCard 
            href="/morning-ruqyah"
            titleKey="nav.merged_morning"
            Icon={Shield}
            color="bg-rose-500"
            description="home.merged_morning_desc"
          />
          <HubCard 
            href="/evening-ruqyah"
            titleKey="nav.merged_evening"
            Icon={Shield}
            color="bg-fuchsia-600"
            description="home.merged_evening_desc"
          />
          <HubCard 
            href="/quran"
            titleKey="nav.quran"
            Icon={BookOpen}
            color="bg-teal-600"
            description="quran.subtitle"
          />
          <HubCard 
            href="/hadith"
            titleKey="nav.hadith"
            Icon={BookOpen}
            color="bg-amber-700"
            description="hadith.subtitle"
          />
          <HubCard 
            href="/fasting"
            titleKey="nav.fasting"
            Icon={Clock}
            color="bg-orange-600"
            description="fasting.white_days_desc"
          />
        </div>
      </div>

      {/* Golden About Us Card */}
      <div className="pt-12 px-2 pb-16">
        <Card className="relative overflow-hidden border-none bg-gradient-to-br from-[#D4AF37] via-[#FFD700] to-[#B8860B] text-white shadow-2xl rounded-[3rem]">
          <div className="absolute inset-0 opacity-20 pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          <CardContent className="p-8 md:p-12 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="space-y-4 text-center md:text-right flex-1">
                <h3 className="text-3xl md:text-4xl font-heading font-black drop-shadow-lg">
                  {t("settings.about_us_title")}
                </h3>
                <p className="text-white/95 leading-relaxed text-lg md:text-xl font-medium max-w-2xl">
                  {t("settings.about_us_content")}
                </p>
              </div>
              <div className="bg-white/25 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/40 shadow-inner group-hover:scale-110 transition-transform duration-500">
                <Heart className="w-16 h-16 md:w-20 md:h-20 text-white fill-current animate-pulse" />
              </div>
            </div>
            
            <div className="mt-10 pt-8 border-t border-white/20 flex flex-wrap items-center justify-center md:justify-between gap-6">
              <div className="flex gap-4">
                <div className="px-6 py-2 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">
                  صدقة جارية
                </div>
                <div className="px-6 py-2 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">
                  Vite 6 + React 19
                </div>
              </div>
              <div className="text-white/60 text-[10px] font-bold tracking-widest uppercase">
                MADE WITH LOVE FOR THE UMMAH
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function HubCard({ href, titleKey, Icon, color, description }: {
  href: string; titleKey: string; Icon: React.ComponentType<{ className?: string }>; color: string; description: string;
}) {
  const { t } = useTranslation();
  return (
    <Link href={href} aria-label={t(titleKey)}>
      <motion.div
        whileHover={{ y: -5 }}
        whileTap={{ scale: 0.98 }}
        className="cursor-pointer"
      >
        <Card className="overflow-hidden border-none shadow-md h-full rounded-3xl bg-card hover:ring-2 hover:ring-primary/20 transition-all">
          <CardContent className="p-5 flex flex-col gap-3 h-full">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg", color)}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">{t(titleKey)}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t(description)}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}
