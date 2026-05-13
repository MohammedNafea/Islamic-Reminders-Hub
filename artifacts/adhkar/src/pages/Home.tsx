import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { toHijri, formatHijriDate } from "@/lib/hijri";
import { getPrayerTimesFromAPI, getPrayerTimes, getNextPrayer } from "@/lib/prayer-times";
import { getDailyProgress, getSettings, getTasbihCount, setTasbihCount } from "@/lib/store";
import { adhkarMorningEvening, adhkarMorningVariant, adhkarMorningOnly, adhkarEveningOnly } from "@/data/adhkar";
import { Card, CardContent } from "@/components/ui/card";
import { Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Home() {
  const { t, i18n } = useTranslation();
  const [date, setDate] = useState(new Date());
  const [hijri, setHijri] = useState(toHijri(new Date()));
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: Date } | null>(null);
  const [progress, setProgress] = useState({ morning: 0, evening: 0 });
  const [salawatCount, setSalawatCount] = useState(0);
  const vibrateRef = useRef<number>(0);
  const settings = getSettings();

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setDate(now);
      if (now.getDate() !== date.getDate()) {
        setHijri(toHijri(now));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [date]);

  useEffect(() => {
    setSalawatCount(getTasbihCount("home_salawat"));

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
      const apiTimes = await getPrayerTimesFromAPI(lat, lng, date, method);
      const times = apiTimes || getPrayerTimes(lat, lng, date);
      setNextPrayer(getNextPrayer(times));
    }
    fetchPrayerTimes();

    const dp = getDailyProgress();
    const morningList = [...adhkarMorningEvening, ...adhkarMorningVariant, ...adhkarMorningOnly];
    const eveningList = [...adhkarMorningEvening, ...adhkarMorningVariant, ...adhkarEveningOnly];
    const calcPct = (list: typeof morningList) => {
      const total = list.reduce((s, d) => s + d.count, 0);
      const done = list.reduce((s, d) => s + Math.min(dp[d.id] || 0, d.count), 0);
      return total > 0 ? (done / total) * 100 : 0;
    };
    setProgress({ morning: calcPct(morningList), evening: calcPct(eveningList) });
  }, []);

  const handleSalawat = () => {
    const next = salawatCount + 1;
    setSalawatCount(next);
    setTasbihCount("home_salawat", next);
    if (settings.vibrate && navigator.vibrate) {
      const now = Date.now();
      if (now - vibrateRef.current > 80) {
        navigator.vibrate(15);
        vibrateRef.current = now;
      }
    }
  };

  const hour = date.getHours();
  let greetingKey = "home.greeting_morning";
  if (hour >= 12 && hour < 18) greetingKey = "home.greeting_evening";
  else if (hour >= 18) greetingKey = "home.greeting_night";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Greeting + Date */}
      <div className="flex flex-col items-center text-center space-y-3 pt-4">
        <h1 className="text-3xl md:text-4xl font-heading text-primary">
          {t(greetingKey)}
        </h1>
        <div className="bg-card px-6 py-3 rounded-2xl border border-border shadow-sm flex flex-col items-center gap-1">
          <p className="text-xl font-serif text-foreground">{formatHijriDate(hijri, i18n.language)}</p>
          <p className="text-sm text-muted-foreground">
            {date.toLocaleDateString(i18n.language, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      {/* Salawat on the Prophet ﷺ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <button
          onClick={handleSalawat}
          className="w-full text-start group"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 to-primary border-none text-primary-foreground p-5 shadow-md hover:shadow-lg transition-all active:scale-[0.99]">
            <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]" />
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="dhikr-text text-2xl text-right text-primary-foreground leading-relaxed" dir="rtl">
                  {t("home.salawat_banner")}
                </p>
                <p className="text-primary-foreground/70 text-sm mt-1">{t("home.salawat_subtitle")}</p>
              </div>
              <div className="shrink-0 text-center">
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={salawatCount}
                    initial={{ opacity: 0, scale: 0.6, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.3, y: -6 }}
                    className="block text-4xl font-bold tabular-nums"
                  >
                    {salawatCount}
                  </motion.span>
                </AnimatePresence>
                <span className="text-primary-foreground/70 text-xs">{t("home.salawat_today")}</span>
              </div>
            </div>
          </div>
        </button>
      </motion.div>

      {/* Next Prayer */}
      {nextPrayer && (
        <Card className="bg-card border border-border overflow-hidden relative shadow-sm">
          <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-full">
                <ClockIcon className="w-5 h-5 text-primary" />
              </div>
              <div className="text-center sm:text-start">
                <p className="text-muted-foreground text-xs font-medium">{t("prayer.next")}</p>
                <p className="text-xl font-bold font-heading text-primary">{t(`prayer.${nextPrayer.name}`)}</p>
              </div>
            </div>
            <div className="text-center sm:text-end">
              <p className="text-muted-foreground text-xs font-medium">{t("prayer.remaining")}</p>
              <p className="text-2xl font-bold font-sans tabular-nums tracking-tight text-foreground">
                {getTimeRemaining(date, nextPrayer.time)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Morning / Evening Progress */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/morning">
          <Card className="hover:border-amber-400/50 transition-colors cursor-pointer group h-full">
            <CardContent className="p-5 flex flex-col h-full justify-between gap-5">
              <div className="flex items-start justify-between">
                <div className="p-2.5 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl group-hover:scale-110 transition-transform">
                  <Sun className="w-5 h-5" />
                </div>
                <div className="text-end">
                  <h3 className="font-heading font-bold">{t("nav.morning")}</h3>
                  <p className="text-xs text-muted-foreground">{t("home.progress")}</p>
                </div>
              </div>
              <ProgressBar value={progress.morning} color="bg-amber-500" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/evening">
          <Card className="hover:border-blue-400/50 transition-colors cursor-pointer group h-full">
            <CardContent className="p-5 flex flex-col h-full justify-between gap-5">
              <div className="flex items-start justify-between">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
                  <Moon className="w-5 h-5" />
                </div>
                <div className="text-end">
                  <h3 className="font-heading font-bold">{t("nav.evening")}</h3>
                  <p className="text-xs text-muted-foreground">{t("home.progress")}</p>
                </div>
              </div>
              <ProgressBar value={progress.evening} color="bg-blue-500" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground tabular-nums">{Math.round(value)}%</span>
        <span className={cn("font-medium", value === 100 ? "text-primary" : "text-muted-foreground")}>
          {value === 100 ? t("home.completed") : t("home.start")}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", color)}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function getTimeRemaining(now: Date, target: Date): string {
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return "00:00:00";
  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((diff % (1000 * 60)) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
