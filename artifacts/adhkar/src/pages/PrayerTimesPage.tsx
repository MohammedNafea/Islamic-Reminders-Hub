import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { getPrayerTimesFromAPI, getPrayerTimes, getCityFromCoords, formatTime, getNextPrayer, PrayerTimesResult } from "@/lib/prayer-times";
import { toHijri, formatHijriDate, isFastingDay } from "@/lib/hijri";
import { getSettings } from "@/lib/store";
import { MapPin, RefreshCw, ChevronLeft, ChevronRight, Info, Calendar as CalendarIcon, Clock, Music, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QiblaCompass } from "@/components/QiblaCompass";

type Tab = "times" | "calendar" | "qibla";

export default function PrayerTimesPage() {
  const { t, i18n } = useTranslation();
  const [times, setTimes] = useState<PrayerTimesResult | null>(null);
  const [city, setCity] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("times");
  const [calDate, setCalDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [coords, setCoords] = useState({ lat: 21.4225, lng: 39.8262 });
  const settings = getSettings();
  const today = new Date();

  const fetchTimes = React.useCallback(async () => {
    setLoading(true);
    const date = new Date();
    let lat = 21.4225, lng = 39.8262;
    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
        setCoords({ lat, lng });
        const c = await getCityFromCoords(lat, lng);
        setCity(c);
      } catch { setCity("Makkah"); }
    } else { setCity("Makkah"); }
    const method = settings.calculationMethod === "MuslimWorldLeague" ? 3
      : settings.calculationMethod === "Egyptian" ? 5 : 4;
    const api = await getPrayerTimesFromAPI(lat, lng, date, method);
    setTimes(api || getPrayerTimes(lat, lng, date));
    setLoading(false);
  }, [settings.calculationMethod]);

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
    { id: "fajr", label: t("prayer.fajr"), time: times.fajr },
    { id: "sunrise", label: t("prayer.sunrise"), time: times.sunrise },
    { id: "dhuhr", label: t("prayer.dhuhr"), time: times.dhuhr },
    { id: "asr", label: t("prayer.asr"), time: times.asr },
    { id: "maghrib", label: t("prayer.maghrib"), time: times.maghrib },
    { id: "isha", label: t("prayer.isha"), time: times.isha },
  ] : [];

  const nightTimes = times ? [
    { id: "first_third", label: t("prayer.first_third"), time: times.firstThirdOfNight },
    { id: "midnight", label: t("prayer.midnight"), time: times.middleOfTheNight },
    { id: "last_third", label: t("prayer.last_third"), time: times.lastThirdOfNight },
    { id: "suhoor", label: t("prayer.suhoor"), time: times.suhoor },
  ] : [];

  const nextPrayer = times ? getNextPrayer(times) : null;

  return (
    <div className="animate-in fade-in duration-500 space-y-6 max-w-lg mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between pt-4">
        <h2 className="text-3xl font-heading font-bold text-primary">{t("nav.times")}</h2>
        <Button variant="outline" size="icon" onClick={fetchTimes} disabled={loading} className="rounded-full hover:bg-primary/5 hover:text-primary transition-colors">
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
                {t("dates.today")}
              </p>
              <p className="text-3xl font-serif font-bold drop-shadow-sm">{formatHijriDate(todayHijri, i18n.language)}</p>
              <p className="text-primary-foreground/90 text-sm font-medium mt-1">
                {today.toLocaleDateString(i18n.language, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            {city && (
              <div className="flex items-center gap-3 bg-white/20 backdrop-blur-md rounded-2xl px-4 py-3 text-sm border border-white/20">
                <MapPin className="w-5 h-5 text-white shrink-0" />
                <div>
                  <p className="font-bold text-white">{city}</p>
                  <p className="text-white/70 text-[10px] uppercase font-bold">{t(`prayer.methods.${settings.calculationMethod}`)}</p>
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
            {tp === "times" ? t("prayer.today_prayers") : tp === "calendar" ? t("prayer.calendar") : t("prayer.qibla.direction", { defaultValue: "اتجاه القبلة" })}
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
                            <span className="font-bold text-lg">{p.label}</span>
                          </div>
                          <span className="font-sans font-black tabular-nums text-2xl tracking-tighter">
                            {formatTime(p.time, i18n.language)}
                          </span>
                        </CardContent>
                      </Card>
                    );
                  })}
                  
                  {/* Qibla Compass Integrated */}
                  <QiblaCompass lat={coords.lat} lng={coords.lng} />

                  <div className="pt-4 pb-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 mb-3">
                      {t("hadith.cat_worship")} - {t("nav.times")}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {nightTimes.map((p) => (
                        <Card key={p.id} className="border-none bg-muted/40 rounded-2xl shadow-sm">
                          <CardContent className="p-4 flex flex-col items-center justify-center gap-1 text-center">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{p.label}</span>
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
                  {calDate.toLocaleDateString(i18n.language, { month: "long", year: "numeric" })}
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
                {viewMode === "grid" ? t("common.list_view") : t("common.grid_view")}
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
                            : isFri
                              ? "bg-primary/10 text-primary border border-primary/10"
                              : fasting 
                                ? "bg-amber-500/10 text-amber-600 border border-amber-500/10"
                                : "bg-card hover:bg-muted text-foreground border border-border/50 shadow-sm"
                        )}
                      >
                        {fasting && !isToday && (
                          <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-50 shadow-sm" />
                        )}
                        <span className="font-black text-sm leading-none">{day}</span>
                        <span className={cn(
                          "text-[9px] font-bold leading-none mt-1 opacity-70",
                          isToday ? "text-primary-foreground" : "text-muted-foreground"
                        )}>
                          {hd.day}
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
                        <th className="p-3 text-start font-bold">{t("dates.today")}</th>
                        <th className="p-3 text-center">{t("prayer.fajr")}</th>
                        <th className="p-3 text-center">{t("prayer.dhuhr")}</th>
                        <th className="p-3 text-center">{t("prayer.asr")}</th>
                        <th className="p-3 text-center">{t("prayer.maghrib")}</th>
                        <th className="p-3 text-center">{t("prayer.isha")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                        const d = new Date(year, month, day);
                        const isToday = d.toDateString() === today.toDateString();
                        const pTimes = getPrayerTimes(coords.lat, coords.lng, d); // Simple local calc for list
                        return (
                          <tr key={day} className={cn(
                            "border-b border-border/20 last:border-0",
                            isToday && "bg-primary/5 font-bold"
                          )}>
                            <td className="p-3">
                              <div className="flex flex-col">
                                <span>{day} {d.toLocaleDateString(i18n.language, { month: 'short' })}</span>
                                <span className="text-[10px] text-muted-foreground">{d.toLocaleDateString(i18n.language, { weekday: 'short' })}</span>
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
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t("fasting.hijri_date")}</p>
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
              <h2 className="text-3xl font-heading font-bold text-primary">{t("prayer.qibla.direction", { defaultValue: "تحديد القبلة" })}</h2>
              <p className="text-muted-foreground">{t("prayer.qibla.subtitle", { defaultValue: "بوصلة دقيقة مدعومة بالواقع المعزز (AR)" })}</p>
            </div>

            <Card className="border-none bg-card/50 backdrop-blur-sm shadow-sm rounded-3xl overflow-hidden">
              <CardContent className="p-4 flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary" />
                <div className="text-sm">
                  <p className="font-bold">{city || "Makkah"}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tabular-nums">
                    {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <QiblaCompass lat={coords.lat} lng={coords.lng} />

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground/80 px-2">{t("prayer.qibla_guide", { defaultValue: "إرشادات الاستخدام" })}</h3>
              <div className="grid grid-cols-1 gap-3">
                <GuideStep number="1" text={t("prayer.qibla.guide_1", { defaultValue: "ضع الهاتف بشكل مسطح على راحة يدك" })} />
                <GuideStep number="2" text={t("prayer.qibla.guide_2", { defaultValue: "تأكد من تفعيل مستشعرات الموقع والبوصلة" })} />
                <GuideStep number="3" text={t("prayer.qibla.guide_3", { defaultValue: "قم بتحريك الهاتف بشكل (8) لمعايرة الحساسات" })} />
                <GuideStep number="4" text={t("prayer.qibla.guide_4", { defaultValue: "استخدم زر الكاميرا لرؤية القبلة في محيطك" })} />
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
              {selectedDay?.toLocaleDateString(i18n.language, { weekday: 'long' })}
            </DialogTitle>
          </DialogHeader>
          {selectedDay && (() => {
            const hd = toHijri(selectedDay);
            const fasting = isFastingDay(hd, selectedDay);
            return (
              <div className="space-y-6 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 p-4 rounded-2xl text-center space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{t("fasting.gregorian_date")}</p>
                    <p className="font-bold text-lg">{selectedDay.getDate()}</p>
                    <p className="text-[11px] font-medium text-muted-foreground">{selectedDay.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-2xl text-center space-y-1 border border-primary/10">
                    <p className="text-[10px] font-bold text-primary/70 uppercase">{t("fasting.hijri_date")}</p>
                    <p className="font-bold text-lg text-primary">{hd.day}</p>
                    <p className="text-[11px] font-medium text-primary/70">{formatHijriDate(hd, i18n.language).split(' ').slice(1).join(' ')}</p>
                  </div>
                </div>

                {fasting && (
                  <Card className="border-none bg-amber-50 dark:bg-amber-950/20 rounded-2xl overflow-hidden ring-1 ring-amber-200/50">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400">
                        <Info className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">{t("fasting.today_fasting")}</p>
                        <p className="text-sm font-bold text-amber-900 dark:text-amber-100">{t(`fasting.${fasting}`)}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <div className="text-center">
                  <Button variant="outline" className="rounded-2xl px-8" onClick={() => setSelectedDay(null)}>
                    {t("common.close")}
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GuideStep({ number, text }: { number: string; text: string }) {
  return (
    <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl border border-border/50">
      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
        {number}
      </div>
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
}
