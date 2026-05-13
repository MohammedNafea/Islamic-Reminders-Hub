import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { getPrayerTimesFromAPI, getPrayerTimes, getCityFromCoords, formatTime, getNextPrayer } from "@/lib/prayer-times";
import { toHijri, formatHijriDate } from "@/lib/hijri";
import { getSettings } from "@/lib/store";
import { MapPin, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type Tab = "times" | "calendar";

export default function PrayerTimesPage() {
  const { t, i18n } = useTranslation();
  const [times, setTimes] = useState<any>(null);
  const [city, setCity] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("times");
  const [calDate, setCalDate] = useState(new Date());
  const settings = getSettings();
  const today = new Date();

  const fetchTimes = async () => {
    setLoading(true);
    const date = new Date();
    let lat = 21.4225, lng = 39.8262;
    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
        const c = await getCityFromCoords(lat, lng);
        setCity(c);
      } catch { setCity("Makkah"); }
    } else { setCity("Makkah"); }
    const method = settings.calculationMethod === "MuslimWorldLeague" ? 3
      : settings.calculationMethod === "Egyptian" ? 5 : 4;
    const api = await getPrayerTimesFromAPI(lat, lng, date, method);
    setTimes(api || getPrayerTimes(lat, lng, date));
    setLoading(false);
  };

  useEffect(() => { fetchTimes(); }, [settings.calculationMethod]);

  // Calendar helpers
  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCalDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCalDate(new Date(year, month + 1, 1));

  const todayHijri = toHijri(today);
  const isAr = i18n.language === "ar";

  // Get prayer names order
  const prayerList = times ? [
    { id: "fajr", label: t("prayer.fajr"), time: times.fajr },
    { id: "sunrise", label: t("prayer.sunrise"), time: times.sunrise },
    { id: "dhuhr", label: t("prayer.dhuhr"), time: times.dhuhr },
    { id: "asr", label: t("prayer.asr"), time: times.asr },
    { id: "maghrib", label: t("prayer.maghrib"), time: times.maghrib },
    { id: "isha", label: t("prayer.isha"), time: times.isha },
  ] : [];

  const nextPrayer = times ? getNextPrayer(times) : null;

  return (
    <div className="animate-in fade-in duration-500 space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pt-4">
        <h2 className="text-2xl font-heading font-bold text-primary">{t("nav.times")}</h2>
        <Button variant="outline" size="icon" onClick={fetchTimes} disabled={loading} className="rounded-full">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </Button>
      </div>

      {/* Today's Dates Card */}
      <Card className="overflow-hidden border-none bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-start">
              <p className="text-primary-foreground/70 text-xs font-medium uppercase tracking-wider mb-1">
                {t("dates.today")}
              </p>
              <p className="text-2xl font-serif font-bold">{formatHijriDate(todayHijri, i18n.language)}</p>
              <p className="text-primary-foreground/80 text-sm mt-0.5">
                {today.toLocaleDateString(i18n.language, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            {city && (
              <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 text-sm">
                <MapPin className="w-4 h-4 text-primary-foreground/70 shrink-0" />
                <div>
                  <p className="font-medium">{city}</p>
                  <p className="text-primary-foreground/60 text-xs">{t(`prayer.methods.${settings.calculationMethod}`)}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl">
        {(["times", "calendar"] as Tab[]).map(tp => (
          <button
            key={tp}
            onClick={() => setTab(tp)}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
              tab === tp
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tp === "times" ? t("prayer.today_prayers") : t("prayer.calendar")}
          </button>
        ))}
      </div>

      {/* Prayer Times Tab */}
      {tab === "times" && (
        <div className="space-y-2">
          {loading && !times ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
            ))
          ) : (
            <>
              {prayerList.map((p, i) => {
                const isNext = nextPrayer?.name === p.id;
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className={cn(
                      "transition-all",
                      isNext && "border-primary/40 bg-primary/5 shadow-sm"
                    )}>
                      <CardContent className="p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          {isNext && (
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          )}
                          <span className={cn("font-medium text-lg", isNext && "text-primary")}>{p.label}</span>
                        </div>
                        <span className={cn("font-sans font-bold tabular-nums text-xl", isNext ? "text-primary" : "text-foreground")}>
                          {formatTime(p.time, i18n.language)}
                        </span>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
              {times?.lastThirdOfNight && (
                <Card className="border-dashed border-2">
                  <CardContent className="p-4 flex justify-between items-center text-muted-foreground">
                    <span className="font-medium">{t("prayer.last_third")}</span>
                    <span className="font-sans tabular-nums font-bold">{formatTime(times.lastThirdOfNight, i18n.language)}</span>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* Calendar Tab */}
      {tab === "calendar" && (
        <div className="space-y-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-muted transition-colors">
              {isAr ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
            <div className="text-center">
              <p className="font-heading font-bold text-lg text-foreground">
                {calDate.toLocaleDateString(i18n.language, { month: "long", year: "numeric" })}
              </p>
            </div>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-muted transition-colors">
              {isAr ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1">
            {(t("dates.days_short", { returnObjects: true }) as string[]).map((d: string) => (
              <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells before first day */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {/* Days */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const d = new Date(year, month, day);
              const hd = toHijri(d);
              const isToday = d.toDateString() === today.toDateString();
              const isFriday = d.getDay() === 5;
              return (
                <div
                  key={day}
                  className={cn(
                    "aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-colors",
                    isToday
                      ? "bg-primary text-primary-foreground font-bold shadow-sm"
                      : isFriday
                        ? "bg-primary/5 text-primary"
                        : "hover:bg-muted"
                  )}
                >
                  <span className="font-semibold text-sm leading-none">{day}</span>
                  <span className={cn(
                    "text-[10px] leading-none mt-0.5",
                    isToday ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}>
                    {hd.day}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Hijri month info */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 text-center space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{t("fasting.hijri_date")}</p>
              <p className="font-heading font-bold text-primary text-lg">
                {formatHijriDate(toHijri(new Date(year, month, Math.min(15, daysInMonth))), i18n.language)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
