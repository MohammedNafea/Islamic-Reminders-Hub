import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { toHijri, formatHijriDate } from "@/lib/hijri";
import { getPrayerTimesFromAPI, getPrayerTimes, getNextPrayer, formatTime } from "@/lib/prayer-times";
import { getDailyProgress, getSettings } from "@/lib/store";
import { adhkarMorningEvening, adhkarMorningVariant, adhkarMorningOnly, adhkarEveningOnly } from "@/data/adhkar";
import { Card, CardContent } from "@/components/ui/card";
import { Sun, Moon, MapPin } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { t, i18n } = useTranslation();
  const [date, setDate] = useState(new Date());
  const [hijri, setHijri] = useState(toHijri(new Date()));
  const [nextPrayer, setNextPrayer] = useState<{name: string, time: Date} | null>(null);
  const [progress, setProgress] = useState({ morning: 0, evening: 0 });
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
    async function fetchPrayerTimes() {
      // Default to Mecca coordinates if location not granted, or use settings
      let lat = 21.4225;
      let lng = 39.8262;
      
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          lat = position.coords.latitude;
          lng = position.coords.longitude;
        } catch (e) {
          // Fallback to default
        }
      }

      const method = settings.calculationMethod === "MuslimWorldLeague" ? 3 : 
                    settings.calculationMethod === "Egyptian" ? 5 : 4; // Simplified mapping

      const apiTimes = await getPrayerTimesFromAPI(lat, lng, date, method);
      const times = apiTimes || getPrayerTimes(lat, lng, date);
      setNextPrayer(getNextPrayer(times));
    }
    
    fetchPrayerTimes();
    
    // Calculate progress
    const dailyProgress = getDailyProgress();
    
    const morningAdhkar = [...adhkarMorningEvening, ...adhkarMorningVariant, ...adhkarMorningOnly];
    const morningTotal = morningAdhkar.reduce((sum, d) => sum + d.count, 0);
    const morningDone = morningAdhkar.reduce((sum, d) => {
      const p = dailyProgress[d.id] || 0;
      return sum + (p > d.count ? d.count : p);
    }, 0);
    
    const eveningAdhkar = [...adhkarMorningEvening, ...adhkarMorningVariant, ...adhkarEveningOnly];
    const eveningTotal = eveningAdhkar.reduce((sum, d) => sum + d.count, 0);
    const eveningDone = eveningAdhkar.reduce((sum, d) => {
      const p = dailyProgress[d.id] || 0;
      return sum + (p > d.count ? d.count : p);
    }, 0);

    setProgress({
      morning: morningTotal > 0 ? (morningDone / morningTotal) * 100 : 0,
      evening: eveningTotal > 0 ? (eveningDone / eveningTotal) * 100 : 0,
    });
  }, [date, settings.calculationMethod]);

  const hour = date.getHours();
  let greetingKey = "home.greeting_morning";
  if (hour >= 12 && hour < 18) greetingKey = "home.greeting_evening";
  else if (hour >= 18) greetingKey = "home.greeting_night";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col items-center text-center space-y-4 pt-4">
        <h1 className="text-3xl md:text-4xl font-heading text-primary">
          {t(greetingKey)}
        </h1>
        <div className="bg-card px-6 py-3 rounded-2xl border border-border shadow-sm flex flex-col items-center gap-1">
          <p className="text-xl font-serif text-foreground">{formatHijriDate(hijri, i18n.language)}</p>
          <p className="text-sm text-muted-foreground">{date.toLocaleDateString(i18n.language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {nextPrayer && (
        <Card className="bg-primary text-primary-foreground border-none overflow-hidden relative">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] mix-blend-overlay"></div>
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-full">
                <ClockIcon />
              </div>
              <div className="text-center md:text-start">
                <p className="text-primary-foreground/80 text-sm font-medium">{t("prayer.next")}</p>
                <p className="text-2xl font-bold font-heading">{t(`prayer.${nextPrayer.name}`)}</p>
              </div>
            </div>
            <div className="text-center md:text-end">
              <p className="text-primary-foreground/80 text-sm font-medium">{t("prayer.remaining")}</p>
              <p className="text-3xl font-bold font-sans tabular-nums tracking-tight">
                {getTimeRemaining(date, nextPrayer.time)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/morning">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer group h-full">
            <CardContent className="p-6 flex flex-col h-full justify-between gap-6">
              <div className="flex items-start justify-between">
                <div className="p-3 bg-secondary/10 text-secondary rounded-xl group-hover:scale-110 transition-transform">
                  <Sun className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <h3 className="font-heading font-bold text-lg">{t("nav.morning")}</h3>
                  <p className="text-sm text-muted-foreground">{t("home.progress")}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{Math.round(progress.morning)}%</span>
                  <span className="font-medium text-primary">{progress.morning === 100 ? t("home.completed") : t("home.start")}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-secondary transition-all duration-1000" style={{ width: `${progress.morning}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/evening">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer group h-full">
            <CardContent className="p-6 flex flex-col h-full justify-between gap-6">
              <div className="flex items-start justify-between">
                <div className="p-3 bg-primary/10 text-primary rounded-xl group-hover:scale-110 transition-transform">
                  <Moon className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <h3 className="font-heading font-bold text-lg">{t("nav.evening")}</h3>
                  <p className="text-sm text-muted-foreground">{t("home.progress")}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{Math.round(progress.evening)}%</span>
                  <span className="font-medium text-primary">{progress.evening === 100 ? t("home.completed") : t("home.start")}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${progress.evening}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

function ClockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  );
}

function getTimeRemaining(now: Date, target: Date): string {
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return "00:00:00";
  
  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((diff % (1000 * 60)) / 1000);
  
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
