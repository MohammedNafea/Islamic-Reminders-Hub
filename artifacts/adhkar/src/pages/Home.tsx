import React, { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toHijri, formatHijriDate } from "@/lib/hijri";
import { getPrayerTimesFromAPI } from "@/lib/prayer-times";
import { getSettings, getTasbihCount, setTasbihCount } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Sun, Moon, Bed, Shield, Clock, BookOpen, Calendar as CalendarIcon, Star as StarIcon, Heart, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, safeFormatDate } from "@/lib/utils";
import { Link } from "wouter";
import { isArabic, getTranslation } from "@/lib/content-i18n";
import { fastingDays } from "@/data/fasting-days";
import { useWiki } from "@/hooks/useWiki";
import { TranslatedText } from "@/components/TranslatedText";
import { logTasbihIncrement } from "@/lib/tracker";

const QURAN_SURAHS = [
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

const QURAN_SURAHS_EN = [
  "Al-Fatihah", "Al-Baqarah", "Ali 'Imran", "An-Nisa'", "Al-Ma'idah", "Al-An'am", "Al-A'raf", "Al-Anfal", "At-Tawbah", "Yunus",
  "Hud", "Yusuf", "Ar-Ra'd", "Ibrahim", "Al-Hijr", "An-Nahl", "Al-Isra'", "Al-Kahf", "Maryam", "Taha",
  "Al-Anbiya'", "Al-Hajj", "Al-Mu'minun", "An-Nur", "Al-Furqan", "Ash-Shu'ara'", "An-Naml", "Al-Qasas", "Al-'Ankabut", "Ar-Rum",
  "Luqman", "As-Sajdah", "Al-Ahzab", "Saba'", "Fatir", "Ya-Sin", "As-Saffat", "Sad", "Az-Zumar", "Ghafir",
  "Fussilat", "Ash-Shura", "Az-Zukhruf", "Ad-Dukhan", "Al-Jathiyah", "Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf",
  "Adh-Dhariyat", "At-Tur", "An-Najm", "Al-Qamar", "Ar-Rahman", "Al-Waqi'ah", "Al-Hadid", "Al-Mujadilah", "Al-Hashr", "Al-Mumtahanah",
  "As-Saff", "Al-Jumu'ah", "Al-Munafiqun", "At-Taghabun", "At-Talaq", "At-Tahrim", "Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij",
  "Nuh", "Al-Jinn", "Al-Muzzammil", "Al-Muddaththir", "Al-Qiyamah", "Al-Insan", "Al-Mursalat", "An-Naba'", "An-Nazi'at", "'Abasa",
  "At-Takwir", "Al-Infitar", "Al-Mutaffifin", "Al-Inshiqaq", "Al-Buruj", "At-Tariq", "Al-A'la", "Al-Ghashiyah", "Al-Fajr", "Al-Balad",
  "Ash-Shams", "Al-Layl", "Ad-Duha", "Ash-Sharh", "At-Tin", "Al-'Alaq", "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-'Adiyat",
  "Al-Qari'ah", "At-Takathur", "Al-'Asr", "Al-Humazah", "Al-Fil", "Quraysh", "Al-Ma'un", "Al-Kauthar", "Al-Kafirun", "An-Nasr",
  "Al-Masad", "Al-Ikhlas", "Al-Falaq", "An-Nas"
];

function getSurahNumber(suraName: string | undefined): number {
  if (!suraName) return 1;
  const normalize = (name: string) => {
    return name
      .replace(/[\u064B-\u0652]/g, "")
      .replace(/[إأآا]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .replace(/[\s\-_']+/g, "")
      .toLowerCase()
      .trim();
  };
  const normalizedInput = normalize(suraName);
  
  // Try Arabic first
  const arIndex = QURAN_SURAHS.findIndex(name => normalize(name) === normalizedInput);
  if (arIndex !== -1) return arIndex + 1;
  
  // Try English
  const enIndex = QURAN_SURAHS_EN.findIndex(name => normalize(name) === normalizedInput);
  if (enIndex !== -1) return enIndex + 1;
  
  return 1;
}

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
        setSalawatCount(getTasbihCount("home_salawat", true));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setSalawatCount(getTasbihCount("home_salawat", true));
  }, []);

  useEffect(() => {
    async function fetchPrayerTimes() {
      let lat = settings.location?.lat ?? 21.4225;
      let lng = settings.location?.lng ?? 39.8262;
      if (!settings.location && navigator.geolocation) {
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
  }, [settings.calculationMethod, hijri.day, settings.location?.lat, settings.location?.lng]);

  const handleSalawat = () => {
    const next = salawatCount + 1;
    setSalawatCount(next);
    setTasbihCount("home_salawat", next, true);
    logTasbihIncrement(1);
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
          arabicSura: wikiData.daily.sura,
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
          return { 
            ...localizedItem, 
            arabicSura: arItem.sura,
            id 
          };
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
      arabicSura: arabicFallback?.sura || "الروم",
      verse_number: fallback?.verse_number || "60", 
      id: vId.toString() 
    };
  }, [t, wikiData, i18n, hourlyRandom]);



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
            {wikiData?.daily?.inspiration ? (
              <TranslatedText
                text={wikiData.daily.inspiration}
                keepArabic={false}
                inline
              />
            ) : (
              t("app.tagline")
            )}
          </p>
        </div>

        <div className="bg-card/50 backdrop-blur-md px-8 py-4 rounded-[2rem] border border-primary/10 shadow-sm flex flex-col items-center gap-1.5 min-w-[280px]">
          <p className="text-2xl font-serif font-bold text-foreground" dir="rtl">
            {formatHijriDate(hijri, i18n.language)}
          </p>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <CalendarIcon className="w-4 h-4 opacity-70" />
            <span>{safeFormatDate(date, i18n.language, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
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

      {/* Daily Verse Section */}
      <div className="w-full">
        <AnimatePresence mode="wait">
          {dailyVerse && (
            <Link href={`/quran?surah=${getSurahNumber(dailyVerse.arabicSura || dailyVerse.sura)}&ayah=${dailyVerse.verse_number || 1}`}>
              <motion.div
                key="verse-wiki"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="bg-card/40 backdrop-blur-sm border border-primary/5 rounded-3xl p-6 shadow-sm flex flex-col justify-between group w-full cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all text-start"
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
                    {dailyVerse.arabicText || dailyVerse.text}
                  </p>
                  {/* Translation — shown for non-Arabic languages */}
                  {!isArabic(i18n.language) && (
                    <TranslatedText
                      text={dailyVerse.arabicText || dailyVerse.text || ""}
                      staticTranslation={dailyVerse.translatedText || undefined}
                      keepArabic={false}
                      translationClassName="text-muted-foreground text-base leading-relaxed text-left border-t border-border/30 pt-3 mt-3"
                      className="border-t border-border/30 pt-3 mt-3"
                    />
                  )}
                </div>
                <p className="text-xs text-primary/60 font-bold mt-4 text-right">
                  {dailyVerse.sura && dailyVerse.sura !== "" 
                    ? `${t(`quran.suras.${dailyVerse.sura}`, { defaultValue: dailyVerse.sura })}${dailyVerse.verse_number ? ` : ${dailyVerse.verse_number}` : ''}` 
                    : t("nav.quran")}
                </p>
              </motion.div>
            </Link>
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
            <Link href="/fasting" className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-transform duration-200 block text-center">
              {t("common.search")}
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Adhkar Hub Grid */}
      <div className="pt-2">
        <h2 className="text-xl font-bold text-foreground mb-4 px-1">{t("nav.adhkar")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
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
            href="/fasting"
            titleKey="nav.fasting"
            Icon={Clock}
            color="bg-orange-600"
            description="fasting.white_days_desc"
          />
          <HubCard 
            href="/sunan"
            titleKey="nav.sunan"
            Icon={StarIcon}
            color="bg-amber-600"
            description="home.sunan_desc"
          />
          <HubCard 
            href="/daily-supplications"
            titleKey="nav.daily_supplications"
            Icon={Clock}
            color="bg-rose-500"
            description="home.daily_supplications_desc"
          />

          <HubCard 
            href="/arafah-hajj"
            titleKey="nav.arafah_hajj"
            Icon={StarIcon}
            color="bg-emerald-600"
            description="home.arafah_hajj_desc"
          />
        </div>
      </div>

      {/* Download Mobile App Banner */}
      <div className="pt-6 px-2">
        <Link href="/download">
          <Card className="cursor-pointer relative overflow-hidden border border-primary/10 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-md rounded-[2rem] group hover:ring-2 hover:ring-primary/20 transition-all duration-300">
            <CardContent className="p-6 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-start">
                <div className="shrink-0 w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-lg leading-tight text-foreground">
                    <TranslatedText
                      text="تطبيق الهاتف المحمول"
                      staticTranslation={i18n.language === 'ar' ? "تطبيق الهاتف المحمول" : "Download Mobile App"}
                      keepArabic={false}
                    />
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    <TranslatedText
                      text="احمل وردك اليومي ومواقيت الصلاة في جيبك بدون إنترنت"
                      staticTranslation={i18n.language === 'ar' ? "احمل وردك اليومي ومواقيت الصلاة في جيبك بدون إنترنت" : "Carry your daily remembrances and prayer times offline"}
                      keepArabic={false}
                    />
                  </p>
                </div>
              </div>
              <div className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
                <TranslatedText
                  text="تحميل الآن"
                  staticTranslation={i18n.language === 'ar' ? "تحميل الآن" : "Download Now"}
                  keepArabic={false}
                />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Dark Emerald & Gold About Us Card */}
      <div className="pt-12 px-2 pb-16">
        <Card className="relative overflow-hidden border border-emerald-500/20 bg-gradient-to-br from-[#0c2419] via-[#123122] to-[#081810] text-white shadow-xl rounded-[2rem] group">
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          <CardContent className="p-6 md:p-8 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-3 text-center md:text-right flex-1">
                <TranslatedText
                  text="عن مركز الأذكار"
                  staticTranslation={getTranslation(t, "settings.about_us_title", i18n.language) || undefined}
                  keepArabic={false}
                  arabicClassName="text-2xl md:text-3xl font-heading font-black text-amber-200 drop-shadow-sm text-center md:text-right"
                  translationClassName="text-amber-200/90 leading-relaxed text-base md:text-lg font-heading font-black border-t-0 pt-0 mt-1 text-center md:text-right"
                />
                
                <TranslatedText
                  text="منصة متكاملة للأذكار اليومية والقرآن ومواقيت الصلاة، صُممت لتكون صدقة جارية تخدم المسلم في يومه وليله."
                  staticTranslation={getTranslation(t, "settings.about_us_content", i18n.language) || undefined}
                  keepArabic={false}
                  arabicClassName="text-emerald-100/90 leading-relaxed text-sm md:text-base font-medium max-w-2xl text-center md:text-right block"
                  translationClassName="text-emerald-100/80 leading-relaxed text-xs md:text-sm font-medium max-w-2xl text-center md:text-right block border-t border-white/10 pt-2.5 mt-2.5"
                />
              </div>
              <div className="bg-[#c9a84c]/10 backdrop-blur-md rounded-2xl p-6 border border-[#c9a84c]/20 shadow-inner group-hover:scale-105 transition-transform duration-300">
                <Heart className="w-12 h-12 md:w-14 md:h-14 text-[#c9a84c] fill-[#c9a84c]/50 animate-pulse" />
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-center md:justify-between gap-4">
              <div className="flex gap-3 flex-wrap justify-center">
                <div className="px-5 py-1.5 bg-[#c9a84c]/15 backdrop-blur-sm rounded-full border border-[#c9a84c]/20 flex flex-col items-center">
                  <TranslatedText
                    text="صدقة جارية"
                    staticTranslation={getTranslation(t, "home.sadaqa_jariya", i18n.language) || undefined}
                    keepArabic={false}
                    arabicClassName="text-[9px] font-black uppercase tracking-widest text-amber-200/90 block text-center"
                    translationClassName="text-[8px] font-bold text-amber-200/70 block text-center border-t-0 pt-0 mt-0.5"
                  />
                </div>
                <div className="px-5 py-1.5 bg-[#c9a84c]/15 backdrop-blur-sm rounded-full border border-[#c9a84c]/20 flex flex-col items-center">
                  <TranslatedText
                    text="صُنع بحب لأمة الإسلام"
                    staticTranslation={getTranslation(t, "home.made_with_love", i18n.language) || undefined}
                    keepArabic={false}
                    arabicClassName="text-[9px] font-black uppercase tracking-widest text-amber-200/90 block text-center"
                    translationClassName="text-[8px] font-bold text-amber-200/70 block text-center border-t-0 pt-0 mt-0.5"
                  />
                </div>
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
  const { t, i18n } = useTranslation();
  const arabicTitle = t(titleKey, { lng: "ar" });
  const arabicDescription = t(description, { lng: "ar" });

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
              <h3 className="font-bold text-lg leading-tight">
                <TranslatedText
                  text={arabicTitle}
                  staticTranslation={getTranslation(t, titleKey, i18n.language) || undefined}
                  keepArabic={false}
                  inline
                />
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                <TranslatedText
                  text={arabicDescription}
                  staticTranslation={getTranslation(t, description, i18n.language) || undefined}
                  keepArabic={false}
                  inline
                />
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}
