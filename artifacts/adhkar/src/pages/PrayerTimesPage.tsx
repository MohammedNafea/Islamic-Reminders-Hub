import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { getPrayerTimesFromAPI, getPrayerTimes, getCityFromCoords, getCoordsFromCity, formatTime, getNextPrayer, PrayerTimesResult } from "@/lib/prayer-times";
import { toHijri, formatHijriDate, isFastingDay, isHijamaDay } from "@/lib/hijri";
import { getSettings, saveSettings } from "@/lib/store";
import { MapPin, RefreshCw, ChevronLeft, ChevronRight, Info, Calendar as CalendarIcon, Clock, Music, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, safeFormatDate } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QiblaCompass } from "@/components/QiblaCompass";
import { TranslatedText } from "@/components/TranslatedText";
import { getTranslation } from "@/lib/content-i18n";

type Tab = "times" | "calendar" | "qibla";

export default function PrayerTimesPage() {
  const { t, i18n } = useTranslation();
  const [times, setTimes] = useState<PrayerTimesResult | null>(null);
  const settings = getSettings();
  const [city, setCity] = useState<string>(settings.location?.city || "");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("times");
  const [calDate, setCalDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [coords, setCoords] = useState(
    settings.location ? { lat: settings.location.lat, lng: settings.location.lng } : { lat: 21.4225, lng: 39.8262 }
  );
  const today = new Date();
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [searchCityQuery, setSearchCityQuery] = useState("");
  const [manualLat, setManualLat] = useState(coords.lat.toString());
  const [manualLng, setManualLng] = useState(coords.lng.toString());

  const fetchTimes = React.useCallback(async (forceRefresh = false) => {
    setLoading(true);
    const date = new Date();
    const currentSettings = getSettings();
    let lat = currentSettings.location?.lat ?? 21.4225;
    let lng = currentSettings.location?.lng ?? 39.8262;
    let c = currentSettings.location?.city || "";

    if (forceRefresh || !currentSettings.location) {
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 })
          );
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
          setCoords({ lat, lng });
          c = await getCityFromCoords(lat, lng, i18n.language);
          setCity(c);
          saveSettings({ location: { lat, lng, city: c } });
          window.dispatchEvent(new Event("settings-changed"));
        } catch {
          c = c || (i18n.language === "ar" ? "مكة المكرمة" : "Makkah");
          setCity(c);
        }
      } else {
        c = c || (i18n.language === "ar" ? "مكة المكرمة" : "Makkah");
        setCity(c);
      }
    } else {
      setCoords({ lat, lng });
      setCity(c);
    }

    const method = currentSettings.calculationMethod === "MuslimWorldLeague" ? 3
      : currentSettings.calculationMethod === "Egyptian" ? 5 : 4;
    const api = await getPrayerTimesFromAPI(lat, lng, date, method);
    setTimes(api || getPrayerTimes(lat, lng, date));
    setLoading(false);
  }, [i18n.language]);

  useEffect(() => { fetchTimes(); }, [fetchTimes]);

  useEffect(() => {
    if (window.location.search.includes("tab=qibla")) {
      setTab("qibla");
    }
  }, []);

  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();


  const todayHijri = toHijri(today);

  const prayerList = times ? [
    { id: "fajr", labelKey: "prayer.fajr", arLabel: "الفجر", time: times.fajr },
    { id: "sunrise", labelKey: "prayer.sunrise", arLabel: "الشروق", time: times.sunrise },
    { id: "dhuhr", labelKey: "prayer.dhuhr", arLabel: "الظهر", time: times.dhuhr },
    { id: "asr", labelKey: "prayer.asr", arLabel: "العصر", time: times.asr },
    { id: "maghrib", labelKey: "prayer.maghrib", arLabel: "المغرب", time: times.maghrib },
    { id: "isha", labelKey: "prayer.isha", arLabel: "العشاء", time: times.isha },
  ] : [];

  const nightTimes = times ? [
    { id: "first_third", labelKey: "prayer.first_third", arLabel: "ثلث الليل الأول", time: times.firstThirdOfNight },
    { id: "midnight", labelKey: "prayer.midnight", arLabel: "منتصف الليل", time: times.middleOfTheNight },
    { id: "last_third", labelKey: "prayer.last_third", arLabel: "ثلث الليل الآخر (التهجد)", time: times.lastThirdOfNight },
    { id: "suhoor", labelKey: "prayer.suhoor", arLabel: "وقت السحور", time: times.suhoor },
  ] : [];

  const nextPrayer = times ? getNextPrayer(times) : null;

  return (
    <div className="animate-in fade-in duration-500 space-y-6 max-w-lg mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between pt-4">
        <h2 className="text-3xl font-heading font-bold text-primary">
          <TranslatedText
            text="مواقيت الصلاة"
            staticTranslation={getTranslation(t, "nav.times", i18n.language) || undefined}
            keepArabic={false}
            inline
          />
        </h2>
        <Button variant="outline" size="icon" onClick={() => fetchTimes(true)} disabled={loading} className="rounded-full hover:bg-primary/5 hover:text-primary transition-colors">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </Button>
      </div>

      {/* Today's Dates Card */}
      <Card className="overflow-hidden border-none bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground shadow-xl rounded-3xl relative">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <CalendarIcon className="w-24 h-24 rotate-12" />
        </div>
        <CardContent className="p-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-start">
              <p className="text-primary-foreground/70 text-xs font-bold uppercase tracking-widest mb-1">
                <TranslatedText
                  text="اليوم"
                  staticTranslation={getTranslation(t, "dates.today", i18n.language) || undefined}
                  keepArabic={false}
                  inline
                />
              </p>
              <p className="text-3xl font-serif font-bold drop-shadow-sm">{formatHijriDate(todayHijri, i18n.language)}</p>
              <p className="text-primary-foreground/90 text-sm font-medium mt-1">
                {safeFormatDate(today, i18n.language, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            {city && (
              <div 
                onClick={() => {
                  setManualLat(coords.lat.toString());
                  setManualLng(coords.lng.toString());
                  setIsLocationOpen(true);
                }}
                className="flex items-center gap-3 bg-white/20 backdrop-blur-md rounded-2xl px-4 py-3 text-sm border border-white/20 cursor-pointer hover:bg-white/30 transition-all shrink-0"
              >
                <MapPin className="w-5 h-5 text-white shrink-0" />
                <div>
                  <p className="font-bold text-white">
                    <TranslatedText text={city} keepArabic={false} inline />
                  </p>
                  <p className="text-white/70 text-[10px] uppercase font-bold">
                    <TranslatedText
                      text={{
                        MuslimWorldLeague: "رابطة العالم الإسلامي",
                        Egyptian: "الهيئة المصرية العامة للمساحة",
                        Karachi: "جامعة العلوم الإسلامية بكراتشي",
                        UmmAlQura: "جامعة أم القرى",
                        Dubai: "دبي",
                        NorthAmerica: "الجمعية الإسلامية لأمريكا الشمالية",
                        Kuwait: "الكويت",
                        Qatar: "قطر",
                        Singapore: "مجلس علماء إندونيسيا",
                        Turkey: "رئاسة الشؤون الدينية التركية",
                      }[settings.calculationMethod] || "جامعة أم القرى"}
                      staticTranslation={getTranslation(t, `prayer.methods.${settings.calculationMethod}`, i18n.language) || undefined}
                      keepArabic={false}
                      inline
                    />
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1.5 bg-muted/50 backdrop-blur-sm rounded-2xl border border-border/50">
        {(["times", "calendar", "qibla"] as Tab[]).map(tp => (
          <button
            key={tp}
            onClick={() => setTab(tp)}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all",
              tab === tp
                ? "bg-card text-primary shadow-sm ring-1 ring-primary/5"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <TranslatedText
              text={tp === "times" ? "صلوات اليوم" : tp === "calendar" ? "التقويم الشهري" : "اتجاه القبلة"}
              staticTranslation={
                tp === "times"
                  ? getTranslation(t, "prayer.today_prayers", i18n.language) || undefined
                  : tp === "calendar"
                    ? getTranslation(t, "prayer.calendar", i18n.language) || undefined
                    : getTranslation(t, "prayer.qibla.direction", i18n.language) || undefined
              }
              keepArabic={false}
              inline
            />
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "times" ? (
          <motion.div
            key="times"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 gap-2.5">
              {loading && !times ? (
                <div className="space-y-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-20 bg-muted/30 animate-pulse rounded-[2rem] border border-primary/5 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {prayerList.map((p) => {
                    const isNext = nextPrayer?.name === p.id;
                    return (
                      <Card key={p.id} className={cn(
                        "transition-all duration-300 rounded-2xl border-none shadow-sm",
                        isNext ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02] z-10" : "bg-card hover:bg-muted/30"
                      )}>
                        <CardContent className="p-4 flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center",
                              isNext ? "bg-white/20" : "bg-primary/10 text-primary"
                            )}>
                              <Clock className="w-5 h-5" />
                            </div>
                             <span className="font-bold text-lg">
                               <TranslatedText
                                 text={p.arLabel}
                                 staticTranslation={getTranslation(t, p.labelKey, i18n.language) || undefined}
                                 keepArabic={false}
                                 inline
                               />
                             </span>
                           </div>
                           <span className="font-sans font-black tabular-nums text-2xl tracking-tighter">
                             {formatTime(p.time, i18n.language)}
                           </span>
                         </CardContent>
                       </Card>
                     );
                   })}
                   
                   <div className="pt-4 pb-2">
                     <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 mb-3">
                       <TranslatedText
                         text="عبادات"
                         staticTranslation={getTranslation(t, "hadith.cat_worship", i18n.language) || undefined}
                         keepArabic={false}
                         inline
                       />
                       {" - "}
                       <TranslatedText
                         text="مواقيت الصلاة"
                         staticTranslation={getTranslation(t, "nav.times", i18n.language) || undefined}
                         keepArabic={false}
                         inline
                       />
                     </p>
                     <div className="grid grid-cols-2 gap-3">
                       {nightTimes.map((p) => (
                         <Card key={p.id} className="border-none bg-muted/40 rounded-2xl shadow-sm">
                           <CardContent className="p-4 flex flex-col items-center justify-center gap-1 text-center">
                             <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                               <TranslatedText
                                 text={p.arLabel}
                                 staticTranslation={getTranslation(t, p.labelKey, i18n.language) || undefined}
                                 keepArabic={false}
                                 inline
                               />
                             </span>
                            <span className="font-sans font-bold text-lg tabular-nums text-foreground">
                              {p.time ? formatTime(p.time, i18n.language) : "--:--"}
                            </span>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        ) : tab === "calendar" ? (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-6"
          >
            {/* Month navigation */}
            <div className="flex items-center justify-between bg-card rounded-2xl p-2 border border-border/50 shadow-sm">
              <Button variant="ghost" size="icon" onClick={() => setCalDate(new Date(year, month - 1))} className="rounded-xl">
                {i18n.language === 'ar' ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </Button>
              <div className="text-center">
                <p className="font-heading font-bold text-lg text-primary">
                  {safeFormatDate(calDate, i18n.language, { month: "long", year: "numeric" })}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setCalDate(new Date(year, month + 1))} className="rounded-xl">
                {i18n.language === 'ar' ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </Button>
            </div>

            {/* List View Toggle */}
            <div className="flex justify-end px-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                className="text-xs font-bold gap-2 rounded-xl"
              >
                <Music className="w-4 h-4" />
                <TranslatedText
                  text={viewMode === "grid" ? "عرض القائمة" : "عرض الشبكة"}
                  staticTranslation={
                    viewMode === "grid"
                      ? getTranslation(t, "common.list_view", i18n.language) || undefined
                      : getTranslation(t, "common.grid_view", i18n.language) || undefined
                  }
                  keepArabic={false}
                  inline
                />
              </Button>
            </div>

            {viewMode === "grid" ? (
              <>
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1">
                  {(t("dates.days_short", { returnObjects: true }) as string[]).map((d: string) => (
                    <div key={d} className="text-center text-[10px] font-black text-muted-foreground uppercase py-2">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                    const d = new Date(year, month, day);
                    const hd = toHijri(d);
                    const isToday = d.toDateString() === today.toDateString();
                    const isFri = d.getDay() === 5;
                    const fasting = isFastingDay(hd, d);
                    const hijama = isHijamaDay(hd);

                    return (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        key={day}
                        onClick={() => setSelectedDay(d)}
                        className={cn(
                          "aspect-square rounded-2xl flex flex-col items-center justify-center transition-all relative overflow-hidden",
                          isToday
                            ? "bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 ring-2 ring-primary ring-offset-2 ring-offset-background"
                            : fasting 
                              ? "bg-amber-500/10 text-amber-600 border border-amber-500/10"
                              : hijama
                                ? "bg-rose-500/10 text-rose-600 border border-rose-500/10"
                                : isFri
                                  ? "bg-primary/10 text-primary border border-primary/10"
                                  : "bg-card hover:bg-muted text-foreground border border-border/50 shadow-sm"
                        )}
                      >
                        {fasting && !isToday && (
                          <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500 shadow-sm" />
                        )}
                        {hijama && !isToday && (
                          <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-rose-500 shadow-sm" />
                        )}
                        <span className="font-black text-sm leading-none">{hd.day}</span>
                        <span className={cn(
                          "text-[9px] font-bold leading-none mt-1 opacity-70",
                          isToday ? "text-primary-foreground" : "text-muted-foreground"
                        )}>
                          {day}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border/50">
                        <th className="p-3 text-start font-bold">
                          <TranslatedText
                            text="اليوم"
                            staticTranslation={getTranslation(t, "dates.today", i18n.language) || undefined}
                            keepArabic={false}
                            inline
                          />
                        </th>
                        <th className="p-3 text-center">
                          <TranslatedText
                            text="الفجر"
                            staticTranslation={getTranslation(t, "prayer.fajr", i18n.language) || undefined}
                            keepArabic={false}
                            inline
                          />
                        </th>
                        <th className="p-3 text-center">
                          <TranslatedText
                            text="الظهر"
                            staticTranslation={getTranslation(t, "prayer.dhuhr", i18n.language) || undefined}
                            keepArabic={false}
                            inline
                          />
                        </th>
                        <th className="p-3 text-center">
                          <TranslatedText
                            text="العصر"
                            staticTranslation={getTranslation(t, "prayer.asr", i18n.language) || undefined}
                            keepArabic={false}
                            inline
                          />
                        </th>
                        <th className="p-3 text-center">
                          <TranslatedText
                            text="المغرب"
                            staticTranslation={getTranslation(t, "prayer.maghrib", i18n.language) || undefined}
                            keepArabic={false}
                            inline
                          />
                        </th>
                        <th className="p-3 text-center">
                          <TranslatedText
                            text="العشاء"
                            staticTranslation={getTranslation(t, "prayer.isha", i18n.language) || undefined}
                            keepArabic={false}
                            inline
                          />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                        const d = new Date(year, month, day);
                        const hd = toHijri(d);
                        const isToday = d.toDateString() === today.toDateString();
                        const pTimes = getPrayerTimes(coords.lat, coords.lng, d); // Simple local calc for list
                        const fasting = isFastingDay(hd, d);
                        const hijama = isHijamaDay(hd);
                        return (
                          <tr key={day} className={cn(
                            "border-b border-border/20 last:border-0",
                            isToday && "bg-primary/5 font-bold",
                            fasting && !isToday && "bg-amber-500/5",
                            hijama && !isToday && "bg-rose-500/5"
                          )}>
                            <td className="p-3">
                              <div className="flex flex-col">
                                <span className="font-bold flex items-center gap-1.5">
                                  {formatHijriDate(hd, i18n.language)}
                                  {fasting && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="صيام" />
                                  )}
                                  {hijama && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" title="حجامة" />
                                  )}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {day} {safeFormatDate(d, i18n.language, { month: 'short', weekday: 'long' })}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 text-center font-sans tabular-nums">{formatTime(pTimes.fajr, i18n.language).split(' ')[0]}</td>
                            <td className="p-3 text-center font-sans tabular-nums">{formatTime(pTimes.dhuhr, i18n.language).split(' ')[0]}</td>
                            <td className="p-3 text-center font-sans tabular-nums">{formatTime(pTimes.asr, i18n.language).split(' ')[0]}</td>
                            <td className="p-3 text-center font-sans tabular-nums">{formatTime(pTimes.maghrib, i18n.language).split(' ')[0]}</td>
                            <td className="p-3 text-center font-sans tabular-nums">{formatTime(pTimes.isha, i18n.language).split(' ')[0]}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Hijri month info */}
            <Card className="bg-gradient-to-br from-muted/50 to-muted/30 border-none rounded-3xl overflow-hidden">
              <CardContent className="p-5 flex items-center gap-5">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <TranslatedText
                      text="التاريخ الهجري"
                      staticTranslation={getTranslation(t, "fasting.hijri_date", i18n.language) || undefined}
                      keepArabic={false}
                      inline
                    />
                  </p>
                  <p className="font-serif font-bold text-primary text-xl">
                    {formatHijriDate(toHijri(new Date(year, month, 15)), i18n.language)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="qibla"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-8 pt-2"
          >
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2 text-primary">
                <Compass className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-heading font-bold text-primary">
                <TranslatedText
                  text="تحديد القبلة"
                  staticTranslation={getTranslation(t, "prayer.qibla.direction", i18n.language) || undefined}
                  keepArabic={false}
                  inline
                />
              </h2>
              <p className="text-muted-foreground">
                <TranslatedText
                  text="بوصلة دقيقة مدعومة بالواقع المعزز (AR)"
                  staticTranslation={getTranslation(t, "prayer.qibla.subtitle", i18n.language) || undefined}
                  keepArabic={false}
                  inline
                />
              </p>
            </div>

            <Card className="border-none bg-card/50 backdrop-blur-sm shadow-sm rounded-3xl overflow-hidden">
              <CardContent className="p-4 flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary" />
                <div className="text-sm">
                  <p className="font-bold">
                    <TranslatedText text={city || "Makkah"} keepArabic={false} inline />
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tabular-nums">
                    {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <QiblaCompass lat={coords.lat} lng={coords.lng} />

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground/80 px-2">
                <TranslatedText
                  text="إرشادات الاستخدام"
                  staticTranslation={getTranslation(t, "prayer.qibla_guide", i18n.language) || undefined}
                  keepArabic={false}
                  inline
                />
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <GuideStep
                  number="1"
                  text={
                    <TranslatedText
                      text="ضع الهاتف بشكل مسطح على راحة يدك"
                      staticTranslation={getTranslation(t, "prayer.qibla.guide_1", i18n.language) || undefined}
                      keepArabic={false}
                      inline
                    />
                  }
                />
                <GuideStep
                  number="2"
                  text={
                    <TranslatedText
                      text="تأكد من تفعيل مستشعرات الموقع والبوصلة"
                      staticTranslation={getTranslation(t, "prayer.qibla.guide_2", i18n.language) || undefined}
                      keepArabic={false}
                      inline
                    />
                  }
                />
                <GuideStep
                  number="3"
                  text={
                    <TranslatedText
                      text="قم بتحريك الهاتف بشكل (8) لمعايرة الحساسات"
                      staticTranslation={getTranslation(t, "prayer.qibla.guide_3", i18n.language) || undefined}
                      keepArabic={false}
                      inline
                    />
                  }
                />
                <GuideStep
                  number="4"
                  text={
                    <TranslatedText
                      text="استخدم زر الكاميرا لرؤية القبلة في محيطك"
                      staticTranslation={getTranslation(t, "prayer.qibla.guide_4", i18n.language) || undefined}
                      keepArabic={false}
                      inline
                    />
                  }
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Day Details Modal */}
      <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent className="rounded-3xl max-w-[340px] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-center font-heading text-xl text-primary">
              {safeFormatDate(selectedDay, i18n.language, { weekday: 'long' })}
            </DialogTitle>
          </DialogHeader>
          {selectedDay && (() => {
            const hd = toHijri(selectedDay);
            const fasting = isFastingDay(hd, selectedDay);
            const hijama = isHijamaDay(hd);
            return (
              <div className="space-y-6 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-primary/5 p-4 rounded-2xl text-center space-y-1 border border-primary/10">
                    <p className="text-[10px] font-bold text-primary/70 uppercase">
                      <TranslatedText
                        text="التاريخ الهجري"
                        staticTranslation={getTranslation(t, "fasting.hijri_date", i18n.language) || undefined}
                        keepArabic={false}
                        inline
                      />
                    </p>
                    <p className="font-bold text-lg text-primary">{hd.day}</p>
                    <p className="text-[11px] font-medium text-primary/70">{formatHijriDate(hd, i18n.language).split(' ').slice(1).join(' ')}</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-2xl text-center space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">
                      <TranslatedText
                        text="التاريخ الميلادي"
                        staticTranslation={getTranslation(t, "fasting.gregorian_date", i18n.language) || undefined}
                        keepArabic={false}
                        inline
                      />
                    </p>
                    <p className="font-bold text-lg">{selectedDay.getDate()}</p>
                    <p className="text-[11px] font-medium text-muted-foreground">{safeFormatDate(selectedDay, i18n.language, { month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>

                {fasting && (
                  <Card className="border-none bg-amber-50 dark:bg-amber-950/20 rounded-2xl overflow-hidden ring-1 ring-amber-200/50">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400">
                        <Info className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                          <TranslatedText
                            text="صيام اليوم"
                            staticTranslation={getTranslation(t, "fasting.today_fasting", i18n.language) || undefined}
                            keepArabic={false}
                            inline
                          />
                        </p>
                        <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
                          <TranslatedText
                            text={
                              fasting === "white_days"
                                ? "الأيام البيض (١٣، ١٤، ١٥)"
                                : fasting === "monday"
                                  ? "صيام الاثنين"
                                  : fasting === "thursday"
                                    ? "صيام الخميس"
                                    : fasting === "arafah"
                                      ? "يوم عرفة"
                                      : fasting === "ashura"
                                        ? "يوم عاشوراء"
                                        : fasting === "tasua"
                                          ? "يوم تاسوعاء"
                                          : fasting === "shaban"
                                            ? "صيام شعبان"
                                            : fasting === "shawwal"
                                              ? "ست من شوال"
                                              : fasting === "dhul_hijjah"
                                                ? "عشر ذي الحجة"
                                                : fasting
                            }
                            staticTranslation={getTranslation(t, `fasting.${fasting}`, i18n.language) || undefined}
                            keepArabic={false}
                            inline
                          />
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {hijama && (
                  <Card className="border-none bg-rose-50 dark:bg-rose-950/20 rounded-2xl overflow-hidden ring-1 ring-rose-200/50">
                    <CardContent className="p-4 flex flex-col gap-3">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/40 rounded-xl flex items-center justify-center text-rose-600 dark:text-rose-400">
                          <Info className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase">
                            <TranslatedText
                              text="أيام الحجامة المستحبة"
                              staticTranslation={getTranslation(t, "settings.notifications_hijama", i18n.language) || undefined}
                              keepArabic={false}
                              inline
                            />
                          </p>
                          <p className="text-sm font-bold text-rose-900 dark:text-rose-100">
                            <TranslatedText
                              text={`اليوم المستحب للحجامة (${hd.day} من الشهر الهجري)`}
                              staticTranslation={
                                i18n.language === "ar"
                                  ? `اليوم المستحب للحجامة (${hd.day} من الشهر الهجري)`
                                  : `Recommended day for Hijama (${hd.day} Hijri)`
                              }
                              keepArabic={false}
                              inline
                            />
                          </p>
                        </div>
                      </div>
                      <div className="border-t border-rose-200/40 dark:border-rose-900/40 pt-2.5">
                        <p className="text-xs leading-relaxed text-rose-900/90 dark:text-rose-200/90 italic font-medium">
                          {i18n.language === "ar" ? (
                            <>
                              الحديث: «مَنْ احْتَجَمَ لِسَبْعَ عَشْرَةَ، وَتِسْعَ عَشْرَةَ، وَإِحْدَى وَعِشْرِينَ، كَانَ شِفَاءً مِنْ كُلِّ دَاءٍ».
                              <span className="block mt-1 text-[10px] text-rose-700/80 dark:text-rose-400/80 font-bold">[عن أنس بن مالك رضي الله عنه، وهو حديث صحيح]</span>
                            </>
                          ) : (
                            <>
                              Hadith: "Whoever undergoes cupping (hijama) on the 17th, 19th or 21st (of the Islamic month) will be cured of every disease."
                              <span className="block mt-1 text-[10px] text-rose-700/80 dark:text-rose-400/80 font-bold">[Narrated by Anas bin Malik, and is a sound Hadith]</span>
                            </>
                          )}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <div className="text-center">
                  <Button variant="outline" className="rounded-2xl px-8" onClick={() => setSelectedDay(null)}>
                    <TranslatedText
                      text="إغلاق"
                      staticTranslation={getTranslation(t, "common.close", i18n.language) || undefined}
                      keepArabic={false}
                      inline
                    />
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Location Settings Dialog */}
      <Dialog open={isLocationOpen} onOpenChange={(open) => !open && setIsLocationOpen(false)}>
        <DialogContent className="rounded-3xl max-w-[380px] border-none shadow-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-center font-heading text-xl text-primary">
              <TranslatedText
                text="إعدادات الموقع الجغرافي"
                staticTranslation={i18n.language === "ar" ? "إعدادات الموقع" : "Location Settings"}
                keepArabic={false}
                inline
              />
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-xs text-muted-foreground text-center">
              <TranslatedText
                text="قم بتعيين موقعك الجغرافي لحساب مواقيت الصلاة واتجاه القبلة بدقة متناهية."
                staticTranslation={i18n.language === "ar" 
                  ? "قم بتعيين موقعك الجغرافي لحساب مواقيت الصلاة واتجاه القبلة بدقة متناهية." 
                  : "Set your location to calculate prayer times and Qibla direction accurately."}
                keepArabic={false}
                inline
              />
            </p>

            {/* GPS Auto Button */}
            <Button 
              onClick={async () => {
                if (navigator.geolocation) {
                  setLoading(true);
                  setIsLocationOpen(false);
                  fetchTimes(true);
                } else {
                  alert(i18n.language === "ar" ? "تحديد الموقع التلقائي غير مدعوم في متصفحك." : "Automatic location is not supported by your browser.");
                }
              }}
              className="w-full rounded-2xl flex items-center justify-center gap-2 py-3"
            >
              <MapPin className="w-4 h-4 text-white" />
              <TranslatedText
                text="تحديد تلقائي عبر GPS"
                staticTranslation={i18n.language === "ar" ? "تحديد تلقائي عبر GPS" : "Detect Automatically (GPS)"}
                keepArabic={false}
                inline
              />
            </Button>

            <div className="relative flex items-center justify-center my-3">
              <hr className="w-full border-t border-border/60" />
              <span className="absolute bg-background px-3 text-[10px] uppercase font-bold text-muted-foreground">
                {i18n.language === "ar" ? "أو إدخال يدوي" : "Or Manual Input"}
              </span>
            </div>

            {/* Manual City Search */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground font-sans">
                {i18n.language === "ar" ? "البحث بالمدينة:" : "Search by City:"}
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={searchCityQuery}
                  onChange={(e) => setSearchCityQuery(e.target.value)}
                  placeholder={i18n.language === "ar" ? "مثال: القاهرة، مكة، دبي..." : "e.g., Cairo, Makkah, London..."} 
                  className="flex-1 bg-muted/30 border border-border/80 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Button 
                  onClick={async () => {
                    if (searchCityQuery.trim()) {
                      const res = await getCoordsFromCity(searchCityQuery.trim());
                      if (res) {
                        saveSettings({ location: { lat: res.lat, lng: res.lng, city: res.displayName.split(",")[0] } });
                        setCoords({ lat: res.lat, lng: res.lng });
                        setCity(res.displayName.split(",")[0]);
                        window.dispatchEvent(new Event("settings-changed"));
                        setIsLocationOpen(false);
                        fetchTimes();
                        alert(i18n.language === "ar" ? `تم تحديد الموقع لـ ${res.displayName.split(",")[0]} بنجاح!` : `Location set to ${res.displayName.split(",")[0]}!`);
                      } else {
                        alert(i18n.language === "ar" ? "تعذر العثور على المدينة، يرجى المحاولة باسم آخر." : "City not found, please check name.");
                      }
                    }
                  }} 
                  className="rounded-2xl shrink-0"
                >
                  {i18n.language === "ar" ? "بحث" : "Search"}
                </Button>
              </div>
            </div>

            {/* Advanced Manual Coordinates */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-muted-foreground font-sans">
                {i18n.language === "ar" ? "الإحداثيات الجغرافية (خيار متقدم):" : "Geographic Coordinates (Advanced):"}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-bold font-sans">{i18n.language === "ar" ? "خط العرض" : "Lat"}</span>
                  <input 
                    type="number" 
                    step="any"
                    value={manualLat}
                    onChange={(e) => setManualLat(e.target.value)}
                    className="w-full bg-muted/30 border border-border/80 rounded-2xl px-3 py-1.5 text-sm text-center font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-bold font-sans">{i18n.language === "ar" ? "خط الطول" : "Lng"}</span>
                  <input 
                    type="number" 
                    step="any"
                    value={manualLng}
                    onChange={(e) => setManualLng(e.target.value)}
                    className="w-full bg-muted/30 border border-border/80 rounded-2xl px-3 py-1.5 text-sm text-center font-mono"
                  />
                </div>
              </div>
              <Button 
                onClick={() => {
                  const lat = parseFloat(manualLat);
                  const lng = parseFloat(manualLng);
                  if (!isNaN(lat) && !isNaN(lng)) {
                    const c = i18n.language === "ar" ? "إحداثيات مخصصة" : "Custom Coordinates";
                    saveSettings({ location: { lat, lng, city: c } });
                    setCoords({ lat, lng });
                    setCity(c);
                    window.dispatchEvent(new Event("settings-changed"));
                    setIsLocationOpen(false);
                    fetchTimes();
                    alert(i18n.language === "ar" ? "تم تعيين الإحداثيات بنجاح!" : "Coordinates set successfully!");
                  } else {
                    alert(i18n.language === "ar" ? "الرجاء إدخال إحداثيات صحيحة." : "Please enter valid coordinates.");
                  }
                }}
                variant="outline" 
                className="w-full rounded-2xl border-primary/20 text-primary hover:bg-primary/5 mt-2"
              >
                {i18n.language === "ar" ? "حفظ الإحداثيات" : "Save Coordinates"}
              </Button>
            </div>

            <div className="text-center pt-2">
              <Button variant="ghost" className="rounded-2xl px-8 text-muted-foreground" onClick={() => setIsLocationOpen(false)}>
                {i18n.language === "ar" ? "إلغاء" : "Cancel"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GuideStep({ number, text }: { number: string; text: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl border border-border/50">
      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
        {number}
      </div>
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
}
